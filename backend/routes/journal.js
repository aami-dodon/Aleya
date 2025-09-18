const express = require("express");
const { Readable } = require("stream");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { normalizeMood } = require("../utils/mood");
const { shapeEntryForMentor } = require("../utils/entries");
const {
  notifyMentorEntry,
  notifyAdmins,
  dispatchNotification,
  NOTIFICATION_TEMPLATES,
} = require("../utils/notifications");

const router = express.Router();

const SHARING_LEVELS = ["private", "mood", "summary", "full"];

function parseResponses(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function formatEntry(row) {
  return {
    id: row.id,
    formId: row.form_id,
    journalerId: row.journaler_id,
    entryDate: row.entry_date,
    createdAt: row.created_at,
    mood: row.mood,
    sharedLevel: row.shared_level,
    summary: row.summary,
    formTitle: row.form_title,
    responses: parseResponses(row.responses),
  };
}

function cleanResponses(form, responses = {}) {
  if (!form) {
    throw new Error("Form not found");
  }

  return form.fields.map((field) => {
    const keyById = field.id ? responses[field.id] : undefined;
    const keyByLabel = responses[field.label];
    const value = keyById ?? keyByLabel ?? null;

    if (field.required && (value === null || value === "")) {
      throw new Error(`Field "${field.label}" is required`);
    }

    return {
      fieldId: field.id,
      label: field.label,
      value,
    };
  });
}

function summarizeResponses(cleaned) {
  if (!Array.isArray(cleaned)) {
    return { summary: "", mood: null };
  }

  let summaryParts = [];
  const moodField = cleaned.find((entry) =>
    entry.label.toLowerCase().includes("mood")
  );
  const causeField = cleaned.find((entry) =>
    entry.label.toLowerCase().startsWith("what caused")
  );
  const learningField = cleaned.find((entry) =>
    entry.label.toLowerCase().startsWith("what did i learn")
  );

  if (moodField?.value) {
    summaryParts.push(`Mood: ${moodField.value}`);
  }

  if (causeField?.value) {
    summaryParts.push(`Cause: ${causeField.value}`);
  }

  if (learningField?.value) {
    summaryParts.push(`Insight: ${learningField.value}`);
  }

  if (!summaryParts.length) {
    summaryParts = cleaned
      .map((entry) => (entry.value ? `${entry.label}: ${entry.value}` : null))
      .filter(Boolean)
      .slice(0, 3);
  }

  return {
    summary: summaryParts.join(" | "),
    mood: normalizeMood(moodField?.value),
  };
}

function resolveVisibility(sharedLevel, fallback = "private") {
  return SHARING_LEVELS.includes(sharedLevel) ? sharedLevel : fallback;
}

async function fetchFormWithFields(formId) {
  const { rows } = await pool.query(
    `SELECT f.id, f.title, f.is_default,
            COALESCE(
              json_agg(
                json_build_object(
                  'id', fld.id,
                  'label', fld.label,
                  'fieldType', fld.field_type,
                  'required', fld.required
                ) ORDER BY fld.id
              ) FILTER (WHERE fld.id IS NOT NULL),
              '[]'
            ) AS fields
     FROM journal_forms f
     LEFT JOIN journal_form_fields fld ON fld.form_id = f.id
     WHERE f.id = $1
     GROUP BY f.id`,
    [formId]
  );

  if (!rows.length) return null;

  const form = rows[0];
  const fields = parseResponses(form.fields);
  return { id: form.id, title: form.title, isDefault: form.is_default, fields };
}

router.post(
  "/",
  authenticate,
  requireRole("journaler"),
  [
    body("formId").isInt(),
    body("responses").custom((value) => typeof value === "object" && value !== null),
    body("sharedLevel")
      .optional()
      .isIn(SHARING_LEVELS)
      .withMessage("Invalid sharing preference"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId, responses, sharedLevel } = req.body;

    try {
      const form = await fetchFormWithFields(formId);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      if (!form.isDefault) {
        const assignment = await pool.query(
          `SELECT id FROM mentor_form_assignments
           WHERE journaler_id = $1 AND form_id = $2`,
          [req.user.id, formId]
        );

        if (!assignment.rows.length) {
          return res.status(403).json({
            error: "This form has not been assigned to you",
          });
        }
      }

      const cleaned = cleanResponses(form, responses);
      const { summary, mood: normalizedMood } = summarizeResponses(cleaned);
      const visibility = resolveVisibility(sharedLevel);

      const { rows } = await pool.query(
        `INSERT INTO journal_entries (journaler_id, form_id, responses, mood, shared_level, summary)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, journaler_id, form_id, entry_date, created_at, mood, shared_level, summary` ,
        [
          req.user.id,
          formId,
          JSON.stringify(cleaned),
          normalizedMood,
          visibility,
          summary,
        ]
      );

      const entry = formatEntry({
        ...rows[0],
        form_title: form.title,
        responses: JSON.stringify(cleaned),
      });

      if (visibility !== "private") {
        const { rows: mentors } = await pool.query(
          `SELECT m.id, m.email, m.name, m.notification_preferences
           FROM mentor_links ml
           JOIN users m ON m.id = ml.mentor_id
           WHERE ml.journaler_id = $1`,
          [req.user.id]
        );

        await Promise.all(
          mentors.map(async (mentor) => {
            await notifyMentorEntry(req.app, {
              mentor,
              journaler: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
              },
              entry,
            });

            const { rows: assignments } = await pool.query(
              `SELECT form_id
               FROM mentor_form_assignments
               WHERE mentor_id = $1 AND journaler_id = $2`,
              [mentor.id, req.user.id]
            );

            if (!assignments.length) {
              return;
            }

            const formIds = assignments.map((assignment) => assignment.form_id);
            const { rows: completion } = await pool.query(
              `SELECT DISTINCT form_id
               FROM journal_entries
               WHERE journaler_id = $1 AND form_id = ANY($2::int[])`,
              [req.user.id, formIds]
            );

            if (completion.length !== formIds.length) {
              return;
            }

            const existing = await pool.query(
              `SELECT id FROM user_notifications
               WHERE user_id = $1 AND type = 'form_all_completed_mentor'
                 AND metadata->>'journalerId' = $2`,
              [mentor.id, String(req.user.id)]
            );

            if (existing.rows.length) {
              return;
            }

            await dispatchNotification(req.app, "form_all_completed_mentor", {
              recipient: mentor,
              mentor,
              journaler: {
                id: req.user.id,
                name: req.user.name,
                email: req.user.email,
              },
              completedCount: formIds.length,
            });
          })
        );
      }

      return res.status(201).json({ entry });
    } catch (error) {
      if (error.message && error.message.includes("Field")) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
);

router.patch(
  "/:id",
  authenticate,
  requireRole("journaler"),
  [
    body("responses")
      .exists()
      .withMessage("responses are required")
      .bail()
      .custom((value) => typeof value === "object" && value !== null)
      .withMessage("responses must be an object"),
    body("sharedLevel")
      .optional()
      .isIn(SHARING_LEVELS)
      .withMessage("Invalid sharing preference"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const entryId = Number(req.params.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: "Invalid entry id" });
    }

    try {
      const { rows } = await pool.query(
        `SELECT e.id, e.journaler_id, e.form_id, e.shared_level, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.id = $1`,
        [entryId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const existing = rows[0];

      if (existing.journaler_id !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      const form = await fetchFormWithFields(existing.form_id);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      const cleaned = cleanResponses(form, req.body.responses);
      const { summary, mood } = summarizeResponses(cleaned);
      const visibility = resolveVisibility(req.body.sharedLevel, existing.shared_level);

      const updated = await pool.query(
        `UPDATE journal_entries
         SET responses = $1, mood = $2, shared_level = $3, summary = $4
         WHERE id = $5
         RETURNING id, journaler_id, form_id, entry_date, created_at, mood, shared_level, summary`,
        [
          JSON.stringify(cleaned),
          mood,
          visibility,
          summary,
          entryId,
        ]
      );

      const entry = formatEntry({
        ...updated.rows[0],
        form_title: form.title,
        responses: JSON.stringify(cleaned),
      });

      const journaler = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      };

      if (visibility === "private") {
        await pool.query(
          `DELETE FROM user_notifications
           WHERE type = 'mentor_entry_shared'
             AND metadata->>'entryId' = $1`,
          [String(entryId)]
        );
      } else {
        const { rows: mentors } = await pool.query(
          `SELECT m.id, m.email, m.name, m.notification_preferences
           FROM mentor_links ml
           JOIN users m ON m.id = ml.mentor_id
           WHERE ml.journaler_id = $1`,
          [req.user.id]
        );

        await Promise.all(
          mentors.map(async (mentor) => {
            const payload = NOTIFICATION_TEMPLATES.mentor_entry_shared.buildInApp({
              journaler,
              entry,
            });

            const result = await pool.query(
              `UPDATE user_notifications
               SET title = $1,
                   body = $2,
                   metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('sharedLevel', $3, 'mood', $4)
               WHERE user_id = $5
                 AND type = 'mentor_entry_shared'
                 AND metadata->>'entryId' = $6`,
              [
                payload.title,
                payload.body || null,
                entry.sharedLevel,
                entry.mood || null,
                mentor.id,
                String(entryId),
              ]
            );

            if (!result.rowCount) {
              await notifyMentorEntry(req.app, {
                mentor,
                journaler,
                entry,
              });
            }
          })
        );
      }

      return res.json({ entry });
    } catch (error) {
      if (error.message && error.message.includes("Field")) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
);

router.delete(
  "/:id",
  authenticate,
  requireRole("journaler"),
  async (req, res, next) => {
    const entryId = Number(req.params.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: "Invalid entry id" });
    }

    try {
      const result = await pool.query(
        `DELETE FROM journal_entries WHERE id = $1 AND journaler_id = $2 RETURNING id`,
        [entryId, req.user.id]
      );

      if (!result.rows.length) {
        return res.status(404).json({ error: "Entry not found" });
      }

      await pool.query(
        `DELETE FROM user_notifications
         WHERE type = 'mentor_entry_shared'
           AND metadata->>'entryId' = $1`,
        [String(entryId)]
      );

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.get("/", authenticate, async (req, res, next) => {
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  try {
    if (req.user.role === "journaler") {
      const { rows } = await pool.query(
        `SELECT e.*, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.journaler_id = $1
         ORDER BY e.entry_date DESC, e.created_at DESC
         LIMIT $2`,
        [req.user.id, limit]
      );

      return res.json({ entries: rows.map(formatEntry) });
    }

    if (req.user.role === "mentor") {
      const journalerId = Number(req.query.journalerId);
      if (!journalerId) {
        return res
          .status(400)
          .json({ error: "journalerId query parameter is required" });
      }

      const link = await pool.query(
        `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
        [req.user.id, journalerId]
      );

      if (!link.rows.length) {
        return res.status(403).json({ error: "No mentorship link established" });
      }

      const { rows } = await pool.query(
        `SELECT e.*, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.journaler_id = $1 AND e.shared_level <> 'private'
         ORDER BY e.entry_date DESC, e.created_at DESC
         LIMIT $2`,
        [journalerId, limit]
      );

      const entries = rows.map((row) =>
        shapeEntryForMentor(formatEntry(row))
      );
      return res.json({ entries });
    }

    return res.json({ entries: [] });
  } catch (error) {
    return next(error);
  }
});

router.get("/export", authenticate, async (req, res, next) => {
  try {
    let entries = [];
    let targetJournalerId;

    if (req.user.role === "journaler") {
      const { rows } = await pool.query(
        `SELECT e.*, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.journaler_id = $1
         ORDER BY e.entry_date DESC, e.created_at DESC`,
        [req.user.id]
      );

      entries = rows.map(formatEntry);
      targetJournalerId = req.user.id;
    } else if (req.user.role === "mentor") {
      const journalerId = Number(req.query.journalerId);
      if (!journalerId) {
        return res
          .status(400)
          .json({ error: "journalerId query parameter is required" });
      }

      const link = await pool.query(
        `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
        [req.user.id, journalerId]
      );

      if (!link.rows.length) {
        return res.status(403).json({ error: "No mentorship link established" });
      }

      const { rows } = await pool.query(
        `SELECT e.*, f.title AS form_title
         FROM journal_entries e
         JOIN journal_forms f ON f.id = e.form_id
         WHERE e.journaler_id = $1 AND e.shared_level <> 'private'
         ORDER BY e.entry_date DESC, e.created_at DESC`,
        [journalerId]
      );

      entries = rows.map((row) => shapeEntryForMentor(formatEntry(row)));
      targetJournalerId = journalerId;
    } else {
      return res.status(403).json({ error: "Access denied" });
    }

    const payload = {
      generatedAt: new Date().toISOString(),
      requester: {
        id: req.user.id,
        role: req.user.role,
      },
      journalerId: targetJournalerId,
      entryCount: entries.length,
      entries,
    };

    const body = JSON.stringify(payload, null, 2);
    const stream = Readable.from(body);
    stream.on("error", next);

    await dispatchNotification(req.app, "data_export_requested_user", {
      recipient: req.user,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      entryCount: entries.length,
    });

    await notifyAdmins(req.app, "data_export_requested_admin", () => ({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      entryCount: entries.length,
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `journal-entries-${targetJournalerId}-${timestamp}.json`;

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    return stream.pipe(res);
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", authenticate, async (req, res, next) => {
  const entryId = Number(req.params.id);

  try {
    const { rows } = await pool.query(
      `SELECT e.*, f.title AS form_title
       FROM journal_entries e
       JOIN journal_forms f ON f.id = e.form_id
       WHERE e.id = $1`,
      [entryId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const entry = formatEntry(rows[0]);

    if (req.user.role === "journaler") {
      if (entry.journalerId !== req.user.id) {
        return res.status(403).json({ error: "Access denied" });
      }
      return res.json({ entry });
    }

    if (req.user.role === "mentor") {
      const link = await pool.query(
        `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
        [req.user.id, entry.journalerId]
      );

      if (!link.rows.length || entry.sharedLevel === "private") {
        return res.status(403).json({ error: "Entry is private" });
      }

      return res.json({ entry: shapeEntryForMentor(entry) });
    }

    return res.status(403).json({ error: "Access denied" });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/:id/comments",
  authenticate,
  async (req, res, next) => {
    const entryId = Number(req.params.id);

    if (!Number.isInteger(entryId) || entryId <= 0) {
      return res.status(400).json({ error: "Invalid entry id" });
    }

    try {
      const { rows: entryRows } = await pool.query(
        `SELECT journaler_id, shared_level FROM journal_entries WHERE id = $1`,
        [entryId]
      );

      if (!entryRows.length) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const entry = entryRows[0];

      if (req.user.role === "journaler") {
        if (entry.journaler_id !== req.user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
      } else if (req.user.role === "mentor") {
        if (entry.shared_level === "private") {
          return res.status(403).json({ error: "Entry is private" });
        }

        const { rows: linkRows } = await pool.query(
          `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
          [req.user.id, entry.journaler_id]
        );

        if (!linkRows.length) {
          return res.status(403).json({ error: "No mentorship link established" });
        }
      } else {
        return res.status(403).json({ error: "Access denied" });
      }

      const { rows } = await pool.query(
        `SELECT c.id, c.comment, c.created_at,
                m.id AS mentor_id, m.name AS mentor_name
         FROM entry_comments c
         JOIN users m ON m.id = c.mentor_id
         WHERE c.entry_id = $1
         ORDER BY c.created_at ASC`,
        [entryId]
      );

      return res.json({ comments: rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/:id/comments",
  authenticate,
  requireRole("mentor"),
  [body("comment").isString().isLength({ min: 1, max: 1000 })],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const entryId = Number(req.params.id);
    const { comment } = req.body;

    try {
      const { rows } = await pool.query(
        `SELECT journaler_id, shared_level FROM journal_entries WHERE id = $1`,
        [entryId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const entry = rows[0];

      if (entry.shared_level === "private") {
        return res.status(403).json({ error: "Entry is private" });
      }

      const link = await pool.query(
        `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
        [req.user.id, entry.journaler_id]
      );

      if (!link.rows.length) {
        return res.status(403).json({ error: "No mentorship link established" });
      }

      const result = await pool.query(
        `INSERT INTO entry_comments (entry_id, mentor_id, comment)
         VALUES ($1, $2, $3)
         RETURNING id, comment, created_at`,
        [entryId, req.user.id, comment]
      );

      return res.status(201).json({ comment: result.rows[0] });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
