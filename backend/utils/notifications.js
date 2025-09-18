const { sendEmail } = require("./mailer");
const { shapeEntryForMentor } = require("./entries");
const { logger } = require("./logger");

function parsePreferences(preferences) {
  if (!preferences) {
    return {};
  }

  if (typeof preferences === "object") {
    return preferences;
  }

  try {
    return JSON.parse(preferences);
  } catch (error) {
    return {};
  }
}

function resolveFrontendBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    (process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")[0].trim()
      : null) ||
    "http://localhost:3000"
  );
}

function buildFrontendLink(pathname = "/dashboard") {
  try {
    const baseUrl = new URL(resolveFrontendBaseUrl());
    const trimmedPath = baseUrl.pathname.replace(/\/$/, "");
    baseUrl.pathname = `${trimmedPath}${pathname.startsWith("/") ? "" : "/"}${
      pathname.startsWith("/") ? pathname.slice(1) : pathname
    }`;
    return baseUrl.toString();
  } catch (error) {
    return `http://localhost:3000${pathname}`;
  }
}

function formatResponsesForText(responses) {
  return responses
    .filter((response) =>
      response && response.value !== null && response.value !== ""
    )
    .map((response) => `- ${response.label}: ${response.value}`)
    .join("\n");
}

function formatResponsesForHtml(responses) {
  const items = responses.filter(
    (response) => response && response.value !== null && response.value !== ""
  );

  if (!items.length) {
    return "";
  }

  const listItems = items
    .map(
      (response) =>
        `<li><strong>${response.label}:</strong> ${String(response.value)}</li>`
    )
    .join("");

  return `<ul style="padding-left:20px;margin:12px 0;">${listItems}</ul>`;
}

async function safeSend(app, message, context) {
  if (!message?.to) {
    return;
  }

  try {
    await sendEmail(app, message, context);
  } catch (error) {
    logger.warn("Email dispatch failed", {
      error: error.message,
      context,
    });
  }
}

async function sendMentorLinkEmails(app, { mentor, journaler }) {
  const dashboardUrl = buildFrontendLink("/mentorship");

  const mentorMessage = {
    to: mentor.email,
    subject: `${journaler.name} confirmed your mentorship on Aleya`,
    text: `Hi ${mentor.name || "there"},\n\n${
      journaler.name
    } confirmed your mentorship request.\n\nVisit ${dashboardUrl} to review their reflections and share your guidance.\n\nRooted in care,\nThe Aleya team`,
    html: `<p>Hi ${mentor.name || "there"},</p>` +
      `<p><strong>${journaler.name}</strong> confirmed your mentorship request.</p>` +
      `<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Open mentorship</a></p>` +
      `<p>Rooted in care,<br/>The Aleya team</p>`,
  };

  const journalerMessage = {
    to: journaler.email,
    subject: `You're now connected with ${mentor.name} on Aleya`,
    text: `Hi ${journaler.name || "there"},\n\n${
      mentor.name
    } is now officially linked as your mentor on Aleya.\n\nVisit ${dashboardUrl} to manage the connection or share your next reflection.\n\nRooted in care,\nThe Aleya team`,
    html: `<p>Hi ${journaler.name || "there"},</p>` +
      `<p>You're now officially linked with <strong>${mentor.name}</strong> on Aleya.</p>` +
      `<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">View mentorship</a></p>` +
      `<p>Rooted in care,<br/>The Aleya team</p>`,
  };

  await Promise.all([
    safeSend(app, mentorMessage, {
      type: "mentor-link-mentor",
      mentorId: mentor.id,
      journalerId: journaler.id,
    }),
    safeSend(app, journalerMessage, {
      type: "mentor-link-journaler",
      mentorId: mentor.id,
      journalerId: journaler.id,
    }),
  ]);
}

async function sendMentorEntryEmail(app, { mentor, journaler, entry }) {
  if (!mentor?.email || !entry) {
    return;
  }

  const preferences = parsePreferences(mentor.notification_preferences);
  const maxLevel = preferences.mentorNotifications || "summary";
  const shaped = shapeEntryForMentor(entry, { maxLevel });

  if (!shaped || shaped.sharedLevel === "private") {
    return;
  }

  const dashboardUrl = buildFrontendLink("/dashboard");
  const entryDateText = entry.entryDate
    ? ` on ${entry.entryDate}`
    : "";
  const subject = `${journaler.name} shared a ${
    entry.formTitle || "journal entry"
  }${entryDateText}`;

  const summaryText = shaped.summary
    ? `\nSummary: ${shaped.summary}`
    : "";
  const responsesText = shaped.responses.length
    ? `\n\nShared responses:\n${formatResponsesForText(shaped.responses)}`
    : "";

  const text = `Hi ${mentor.name || "there"},\n\n${journaler.name} shared a new ${
    entry.formTitle || "journal entry"
  }${entryDateText}.\nMood: ${shaped.mood || "Not provided"}${summaryText}${responsesText}\n\nSign in to support them: ${dashboardUrl}\n\nRooted in care,\nThe Aleya team`;

  const htmlSummary = shaped.summary
    ? `<p><strong>Summary:</strong> ${shaped.summary}</p>`
    : "";
  const htmlResponses = formatResponsesForHtml(shaped.responses);

  const html = `<p>Hi ${mentor.name || "there"},</p>` +
    `<p><strong>${journaler.name}</strong> shared a new <em>${
      entry.formTitle || "journal entry"
    }</em>${entryDateText}.</p>` +
    `<p><strong>Mood:</strong> ${shaped.mood || "Not provided"}</p>` +
    htmlSummary +
    htmlResponses +
    `<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Review on Aleya</a></p>` +
    `<p>Rooted in care,<br/>The Aleya team</p>`;

  await safeSend(
    app,
    {
      to: mentor.email,
      subject,
      text,
      html,
    },
    {
      type: "mentor-entry",
      mentorId: mentor.id,
      journalerId: journaler.id,
      entryId: entry.id,
      sharedLevel: shaped.sharedLevel,
    }
  );
}

async function sendMentorPanicEmail(app, { mentor, sender, message }) {
  if (!mentor?.email || !sender?.email) {
    return;
  }

  const subject = `[Aleya] Important support alert from ${
    sender.name || "a mentor"
  }`;
  const dashboardUrl = buildFrontendLink("/dashboard");
  const safeMessage = message || "Mentor requested urgent support.";

  const text = `Hi ${mentor.name || "there"},\n\n${
    sender.name || "A mentor"
  } triggered the panic button and asked for urgent support.\n\nMessage:\n${safeMessage}\n\nYou can coordinate next steps from the mentor dashboard: ${dashboardUrl}\n\nRooted in care,\nThe Aleya team`;

  const html = `<p>Hi ${mentor.name || "there"},</p>` +
    `<p><strong>${sender.name || "A mentor"}</strong> triggered the panic button and asked for urgent support.</p>` +
    `<blockquote style="border-left:4px solid #f87171;margin:16px 0;padding-left:12px;color:#4a5568;">${safeMessage.replace(
      /\n/g,
      "<br/>"
    )}</blockquote>` +
    `<p><a href="${dashboardUrl}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open mentor dashboard</a></p>` +
    `<p>Rooted in care,<br/>The Aleya team</p>`;

  await safeSend(
    app,
    {
      to: mentor.email,
      cc: sender.email,
      subject,
      text,
      html,
    },
    {
      type: "mentor-panic-alert",
      mentorId: mentor.id,
      senderId: sender.id,
    }
  );
}

module.exports = {
  sendMentorLinkEmails,
  sendMentorEntryEmail,
  sendMentorPanicEmail,
};
