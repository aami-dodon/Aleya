const pool = require("../db");
const { logger, serializeError } = require("../utils/logger");
const { sendEmail } = require("../utils/mailer");
const { shapeEntryForMentor } = require("../utils/entries");
const {
  createMentorEntryNotificationEmail,
  createMentorDigestEmail,
} = require("../utils/emailTemplates");

function ensureResponsesArray(raw) {
  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  if (typeof raw === "object") {
    const candidates = Object.values(raw);
    if (
      candidates.every(
        (value) =>
          value && typeof value === "object" && "label" in value && "value" in value
      )
    ) {
      return candidates;
    }
    return [];
  }

  return [];
}

async function fetchLinkedMentors(journalerId) {
  const { rows } = await pool.query(
    `SELECT ml.mentor_id, u.name, u.email
       FROM mentor_links ml
       JOIN users u ON u.id = ml.mentor_id
      WHERE ml.journaler_id = $1
        AND u.is_verified = TRUE
      ORDER BY u.name`,
    [journalerId]
  );

  return rows
    .map((row) => ({
      id: row.mentor_id,
      name: row.name,
      email: row.email,
    }))
    .filter((mentor) => typeof mentor.email === "string" && mentor.email.trim());
}

function shapeEntry(entry, options = {}) {
  if (!entry) {
    return null;
  }

  return shapeEntryForMentor(
    {
      ...entry,
      responses: ensureResponsesArray(entry.responses),
    },
    options
  );
}

async function dispatchEntryNotifications(app, { entry, journaler }) {
  if (!app || !entry || !journaler) {
    return;
  }

  if (!entry.sharedLevel || entry.sharedLevel === "private") {
    return;
  }

  let mentors;

  try {
    mentors = await fetchLinkedMentors(journaler.id);
  } catch (error) {
    logger.error("Failed to load mentors for entry notification", {
      journalerId: journaler.id,
      error: serializeError(error),
    });
    return;
  }
  if (!mentors.length) {
    return;
  }

  for (const mentor of mentors) {
    const shaped = shapeEntry(entry, {});
    if (!shaped || shaped.sharedLevel === "private") {
      continue;
    }

    const { subject, text, html } = createMentorEntryNotificationEmail({
      mentorName: mentor.name,
      journalerName: journaler.name,
      entryDate: entry.entryDate,
      formTitle: entry.formTitle,
      shareLevel: shaped.sharedLevel,
      mood: shaped.mood,
      summary: shaped.summary,
      responses: shaped.responses,
    });

    try {
      await sendEmail(
        app,
        {
          to: mentor.email,
          subject,
          text,
          html,
        },
        { type: "mentor_entry", mentorId: mentor.id, entryId: entry.id }
      );
      logger.info("Sent mentor entry notification", {
        mentorId: mentor.id,
        entryId: entry.id,
      });
    } catch (error) {
      logger.error("Failed to send mentor entry notification", {
        mentorId: mentor.id,
        entryId: entry.id,
        error: serializeError(error),
      });
    }
  }
}

async function buildMentorDigestPayloads({ since, until }) {
  if (!(since instanceof Date) || Number.isNaN(since.valueOf())) {
    throw new Error("A valid 'since' date is required");
  }

  if (!(until instanceof Date) || Number.isNaN(until.valueOf())) {
    throw new Error("A valid 'until' date is required");
  }

  const { rows } = await pool.query(
    `SELECT ml.mentor_id,
            mentor.name   AS mentor_name,
            mentor.email  AS mentor_email,
            journaler.id  AS journaler_id,
            journaler.name AS journaler_name,
            e.id          AS entry_id,
            e.form_id     AS form_id,
            e.entry_date  AS entry_date,
            e.created_at  AS created_at,
            e.mood        AS mood,
            e.shared_level AS shared_level,
            e.summary     AS summary,
            e.responses   AS responses,
            f.title       AS form_title
       FROM mentor_links ml
       JOIN users mentor ON mentor.id = ml.mentor_id AND mentor.is_verified = TRUE
       JOIN users journaler ON journaler.id = ml.journaler_id
       JOIN journal_entries e ON e.journaler_id = journaler.id
       JOIN journal_forms f ON f.id = e.form_id
      WHERE e.created_at >= $1
        AND e.created_at < $2
        AND e.shared_level <> 'private'
        AND ml.established_at <= e.created_at
      ORDER BY ml.mentor_id, journaler.id, e.created_at`,
    [since.toISOString(), until.toISOString()]
  );

  const digests = new Map();

  for (const row of rows) {
    if (!row.mentor_email) {
      continue;
    }

    let digest = digests.get(row.mentor_id);
    if (!digest) {
      digest = {
        mentor: {
          id: row.mentor_id,
          name: row.mentor_name,
          email: row.mentor_email,
        },
        mentees: new Map(),
        entryCount: 0,
      };
      digests.set(row.mentor_id, digest);
    }

    let mentee = digest.mentees.get(row.journaler_id);
    if (!mentee) {
      mentee = {
        id: row.journaler_id,
        name: row.journaler_name,
        entries: [],
      };
      digest.mentees.set(row.journaler_id, mentee);
    }

    const shaped = shapeEntry({
      id: row.entry_id,
      formId: row.form_id,
      entryDate: row.entry_date,
      createdAt: row.created_at,
      mood: row.mood,
      sharedLevel: row.shared_level,
      summary: row.summary,
      responses: row.responses,
      formTitle: row.form_title,
    });

    if (!shaped || shaped.sharedLevel === "private") {
      continue;
    }

    mentee.entries.push(shaped);
    digest.entryCount += 1;
  }

  return Array.from(digests.values())
    .filter((digest) => digest.entryCount > 0)
    .map((digest) => ({
      mentor: digest.mentor,
      mentees: Array.from(digest.mentees.values()).map((mentee) => ({
        journalerId: mentee.id,
        journalerName: mentee.name,
        entries: mentee.entries,
      })),
      entryCount: digest.entryCount,
    }));
}

async function dispatchMentorDigests(app, { since, until, periodLabel }) {
  const digests = await buildMentorDigestPayloads({ since, until });

  if (!digests.length) {
    logger.info("No mentor digest emails to send", {
      since: since.toISOString(),
      until: until.toISOString(),
    });
    return;
  }

  const label =
    typeof periodLabel === "string" && periodLabel.trim().length
      ? periodLabel.trim()
      : `${since.toISOString()} – ${until.toISOString()}`;

  for (const digest of digests) {
    const { subject, text, html } = createMentorDigestEmail({
      mentorName: digest.mentor.name,
      periodLabel: label,
      entryCount: digest.entryCount,
      mentees: digest.mentees,
    });

    try {
      await sendEmail(
        app,
        {
          to: digest.mentor.email,
          subject,
          text,
          html,
        },
        {
          type: "mentor_digest",
          mentorId: digest.mentor.id,
          since: since.toISOString(),
          until: until.toISOString(),
        }
      );
      logger.info("Sent mentor digest", {
        mentorId: digest.mentor.id,
        entryCount: digest.entryCount,
      });
    } catch (error) {
      logger.error("Failed to send mentor digest", {
        mentorId: digest.mentor.id,
        error: serializeError(error),
      });
    }
  }
}

module.exports = {
  dispatchEntryNotifications,
  buildMentorDigestPayloads,
  dispatchMentorDigests,
};
