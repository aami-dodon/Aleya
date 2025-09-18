const pool = require("../db");
const { sendEmail } = require("./mailer");
const { shapeEntryForMentor } = require("./entries");
const { logger } = require("./logger");

const DEFAULT_CHANNELS = {
  email: true,
  inApp: true,
};

const DEFAULT_CATEGORIES = {
  account: true,
  mentorship: true,
  forms: true,
  exports: true,
  alerts: true,
};

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

function shouldSendInApp(preferences, category) {
  if (!preferences) return true;
  const parsed = parsePreferences(preferences);
  const categories = {
    ...DEFAULT_CATEGORIES,
    ...(parsed.categories || {}),
  };
  const channels = {
    ...DEFAULT_CHANNELS,
    ...(parsed.channels || {}),
  };
  if (categories[category] === false) {
    return false;
  }
  return channels.inApp !== false;
}

function shouldSendEmail(preferences, category) {
  if (!preferences) return true;
  const parsed = parsePreferences(preferences);
  const categories = {
    ...DEFAULT_CATEGORIES,
    ...(parsed.categories || {}),
  };
  const channels = {
    ...DEFAULT_CHANNELS,
    ...(parsed.channels || {}),
  };
  if (categories[category] === false) {
    return false;
  }
  return channels.email !== false;
}

function formatResponsesForText(responses) {
  return responses
    .filter(
      (response) => response && response.value !== null && response.value !== ""
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

const NOTIFICATION_TEMPLATES = {
  mentee_registered_admin: {
    category: "account",
    emailTemplate: "mentee_registered",
    buildInApp: ({ mentee }) => ({
      title: `${mentee.name || mentee.email} joined as a mentee`,
      body: `${mentee.name || mentee.email} just registered as a mentee and is waiting to be paired with a mentor.`,
      actionLabel: "Open dashboard",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        menteeId: mentee.id,
        email: mentee.email,
      },
    }),
    buildEmail: ({ recipient, mentee }) => ({
      to: recipient.email,
      subject: `New mentee registration: ${mentee.name || mentee.email}`,
      text: `Hi ${recipient.name || "there"},\n\n${
        mentee.name || mentee.email
      } just registered as a mentee on Aleya.\n\nVisit ${buildFrontendLink(
        "/dashboard"
      )} to review new registrations and ensure they are welcomed promptly.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${recipient.name || "there"},</p>` +
        `<p><strong>${mentee.name || mentee.email}</strong> just registered as a mentee on Aleya.</p>` +
        `<p><a href="${buildFrontendLink(
          "/dashboard"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open dashboard</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  mentor_application_submitted_admin: {
    category: "account",
    emailTemplate: "mentor_application_submitted",
    buildInApp: ({ mentor }) => ({
      title: `${mentor.name || mentor.email} applied to be a mentor`,
      body: `${mentor.name || mentor.email} requested mentor access. Review their application to keep the directory current.`,
      actionLabel: "Review mentor applications",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        email: mentor.email,
      },
    }),
    buildEmail: ({ recipient, mentor }) => ({
      to: recipient.email,
      subject: `Mentor application received: ${mentor.name || mentor.email}`,
      text: `Hi ${recipient.name || "there"},\n\n${
        mentor.name || mentor.email
      } submitted a mentor application on Aleya.\n\nVisit ${buildFrontendLink(
        "/dashboard"
      )} to review and respond.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${recipient.name || "there"},</p>` +
        `<p><strong>${mentor.name || mentor.email}</strong> submitted a mentor application on Aleya.</p>` +
        `<p><a href="${buildFrontendLink(
          "/dashboard"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Review mentor approvals</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  mentor_application_decision: {
    category: "account",
    emailTemplate: "mentor_application_decision",
    buildInApp: ({ status, mentor }) => {
      const approved = status === "approved";
      return {
        title: approved
          ? "Your mentor application was approved"
          : "Update on your mentor application",
        body: approved
          ? "Welcome aboard! You now have access to the mentor tools and can support journalers right away."
          : "Thanks for your interest. At this time the admin team could not approve the application. Reach out if you have questions.",
        actionLabel: approved ? "Visit mentor dashboard" : "View support resources",
        actionUrl: approved
          ? buildFrontendLink("/dashboard")
          : buildFrontendLink("/support"),
        metadata: {
          status,
          mentorId: mentor.id,
        },
      };
    },
    buildEmail: ({ mentor, status }) => {
      const approved = status === "approved";
      const subject = approved
        ? "Your Aleya mentor access is ready"
        : "Update on your Aleya mentor application";
      const text = approved
        ? `Hi ${mentor.name || "there"},\n\nWe're happy to share that your mentor application was approved. Sign in to start supporting journalers: ${buildFrontendLink(
            "/dashboard"
          )}\n\nRooted in care,\nThe Aleya team`
        : `Hi ${mentor.name || "there"},\n\nThanks for applying to mentor on Aleya. After review we weren't able to approve the application right now. If you have any questions, reply to this message and our team will help.\n\nRooted in care,\nThe Aleya team`;
      const html = approved
        ? `<p>Hi ${mentor.name || "there"},</p>` +
          `<p>We're happy to share that your mentor application was approved.</p>` +
          `<p><a href="${buildFrontendLink(
            "/dashboard"
          )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open mentor dashboard</a></p>` +
          `<p>Rooted in care,<br/>The Aleya team</p>`
        : `<p>Hi ${mentor.name || "there"},</p>` +
          `<p>Thanks for applying to mentor on Aleya. After review we weren't able to approve the application right now.</p>` +
          `<p>If you have any questions, reply to this email and our team will help.</p>` +
          `<p>Rooted in care,<br/>The Aleya team</p>`;
      return {
        to: mentor.email,
        subject,
        text,
        html,
      };
    },
  },
  mentorship_linked_mentor: {
    category: "mentorship",
    emailTemplate: "mentorship_linked",
    buildInApp: ({ journaler }) => ({
      title: `${journaler.name || "Your mentee"} is now linked with you`,
      body: "You're connected! Check in to see how they're doing and share guidance.",
      actionLabel: "Open mentorship",
      actionUrl: buildFrontendLink("/mentorship"),
      metadata: {
        journalerId: journaler.id,
      },
    }),
    buildEmail: ({ mentor, journaler }) => ({
      to: mentor.email,
      subject: `${journaler.name} confirmed your mentorship on Aleya`,
      text: `Hi ${mentor.name || "there"},\n\n${
        journaler.name
      } confirmed your mentorship request.\n\nVisit ${buildFrontendLink(
        "/mentorship"
      )} to review their reflections and share your guidance.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${mentor.name || "there"},</p>` +
        `<p><strong>${journaler.name}</strong> confirmed your mentorship request.</p>` +
        `<p><a href="${buildFrontendLink(
          "/mentorship"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open mentorship</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  mentorship_linked_journaler: {
    category: "mentorship",
    emailTemplate: "mentorship_linked",
    buildInApp: ({ mentor }) => ({
      title: `You're now connected with ${mentor.name}`,
      body: "Share a reflection so your mentor can understand how to support you best.",
      actionLabel: "Open dashboard",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        mentorId: mentor.id,
      },
    }),
    buildEmail: ({ journaler, mentor }) => ({
      to: journaler.email,
      subject: `You're now connected with ${mentor.name} on Aleya`,
      text: `Hi ${journaler.name || "there"},\n\n${
        mentor.name
      } is now officially linked as your mentor on Aleya.\n\nVisit ${buildFrontendLink(
        "/mentorship"
      )} to manage the connection or share your next reflection.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${journaler.name || "there"},</p>` +
        `<p>You're now officially linked with <strong>${mentor.name}</strong> on Aleya.</p>` +
        `<p><a href="${buildFrontendLink(
          "/mentorship"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">View mentorships</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  mentor_entry_shared: {
    category: "mentorship",
    emailTemplate: "mentor_entry_shared",
    buildInApp: ({ journaler, entry }) => {
      const summaryText = entry.summary
        ? entry.summary
        : "A mentee shared new insights.";
      return {
        title: `${journaler.name || "Your mentee"} shared a ${
          entry.formTitle || "reflection"
        }`,
        body: `${summaryText}`,
        actionLabel: "Review entry",
        actionUrl: buildFrontendLink("/dashboard"),
        metadata: {
          journalerId: journaler.id,
          entryId: entry.id,
          sharedLevel: entry.sharedLevel,
          mood: entry.mood,
        },
      };
    },
    buildEmail: ({ mentor, journaler, entry, shaped }) => {
      if (!mentor.email) {
        return null;
      }

      const entryDateText = entry.entryDate ? ` on ${entry.entryDate}` : "";
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
      }${entryDateText}.\nMood: ${shaped.mood || "Not provided"}${summaryText}${responsesText}\n\nSign in to support them: ${buildFrontendLink(
        "/dashboard"
      )}\n\nRooted in care,\nThe Aleya team`;

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
        `<p><a href="${buildFrontendLink(
          "/dashboard"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Review on Aleya</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`;

      return {
        to: mentor.email,
        subject,
        text,
        html,
      };
    },
  },
  mentor_panic_alert: {
    category: "alerts",
    emailTemplate: "mentor_panic_alert",
    buildInApp: ({ sender, message }) => ({
      title: `${sender.name || "A mentor"} needs urgent support`,
      body: message || "A mentor asked for immediate assistance.",
      actionLabel: "Coordinate response",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        senderId: sender.id,
        senderEmail: sender.email,
      },
    }),
    buildEmail: ({ mentor, sender, message }) => {
      if (!mentor.email || !sender.email) {
        return null;
      }
      const safeMessage = message || "Mentor requested urgent support.";
      return {
        to: mentor.email,
        cc: sender.email,
        subject: `[Aleya] Important support alert from ${
          sender.name || "a mentor"
        }`,
        text: `Hi ${mentor.name || "there"},\n\n${
          sender.name || "A mentor"
        } triggered the panic button and asked for urgent support.\n\nMessage:\n${safeMessage}\n\nYou can coordinate next steps from the mentor dashboard: ${buildFrontendLink(
          "/dashboard"
        )}\n\nRooted in care,\nThe Aleya team`,
        html: `<p>Hi ${mentor.name || "there"},</p>` +
          `<p><strong>${sender.name || "A mentor"}</strong> triggered the panic button and asked for urgent support.</p>` +
          `<blockquote style="border-left:4px solid #f87171;margin:16px 0;padding-left:12px;color:#4a5568;">${safeMessage.replace(
            /\n/g,
            "<br/>"
          )}</blockquote>` +
          `<p><a href="${buildFrontendLink(
            "/dashboard"
          )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open mentor dashboard</a></p>` +
          `<p>Rooted in care,<br/>The Aleya team</p>`,
      };
    },
  },
  form_review_required: {
    category: "forms",
    emailTemplate: "form_review_required",
    buildInApp: ({ form, creator }) => ({
      title: `${creator.name || "A mentor"} created a new form`,
      body: `“${form.title}” is ready for review before it joins the shared library.`,
      actionLabel: "Review form",
      actionUrl: buildFrontendLink("/forms"),
      metadata: {
        formId: form.id,
        creatorId: creator.id,
      },
    }),
    buildEmail: ({ recipient, form, creator }) => ({
      to: recipient.email,
      subject: `New form submitted: ${form.title}`,
      text: `Hi ${recipient.name || "there"},\n\n${
        creator.name || creator.email || "A mentor"
      } created a new form titled "${form.title}". Review and approve it so mentors can use it safely.\n\nOpen: ${buildFrontendLink(
        `/admin/forms/${form.id}`
      )}\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${recipient.name || "there"},</p>` +
        `<p><strong>${creator.name || creator.email || "A mentor"}</strong> created a new form titled <em>${form.title}</em>.</p>` +
        `<p><a href="${buildFrontendLink(
          "/forms"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Review form</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  form_assignment_journaler: {
    category: "forms",
    emailTemplate: "form_assignment",
    buildInApp: ({ mentor, form }) => ({
      title: `${mentor.name || "Your mentor"} assigned “${form.title}”`,
      body: "Take a moment to reflect. Completing the prompt helps your mentor support you.",
      actionLabel: "Open form",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        mentorId: mentor.id,
        formId: form.id,
      },
    }),
    buildEmail: ({ journaler, mentor, form }) => ({
      to: journaler.email,
      subject: `${mentor.name || "Your mentor"} assigned a new reflection`,
      text: `Hi ${journaler.name || "there"},\n\n${
        mentor.name || "Your mentor"
      } assigned the form "${form.title}" to you. Share your reflections when you're ready: ${buildFrontendLink(
        `/forms/${form.id}`
      )}\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${journaler.name || "there"},</p>` +
        `<p><strong>${mentor.name || "Your mentor"}</strong> assigned the form <em>${form.title}</em> to you.</p>` +
        `<p><a href="${buildFrontendLink(
          "/dashboard"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Open Aleya</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  form_all_completed_mentor: {
    category: "forms",
    emailTemplate: "form_all_completed",
    buildInApp: ({ journaler, completedCount }) => ({
      title: `${journaler.name || "Your mentee"} completed every assigned form`,
      body: `They finished ${completedCount} assigned prompts. Celebrate their progress and plan next steps together.`,
      actionLabel: "View reflections",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        journalerId: journaler.id,
        completedCount,
      },
    }),
    buildEmail: ({ mentor, journaler, completedCount }) => ({
      to: mentor.email,
      subject: `${journaler.name} completed every assigned form`,
      text: `Hi ${mentor.name || "there"},\n\n${
        journaler.name
      } completed all ${completedCount} forms you've assigned. Take a moment to celebrate their work and plan the next reflection together: ${buildFrontendLink(
        "/dashboard"
      )}\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${mentor.name || "there"},</p>` +
        `<p><strong>${journaler.name}</strong> completed all ${completedCount} forms you've assigned.</p>` +
        `<p><a href="${buildFrontendLink(
          "/dashboard"
        )}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Review progress</a></p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  account_deleted_admin: {
    category: "account",
    emailTemplate: "account_deleted",
    buildInApp: ({ user }) => ({
      title: `${user.name || user.email} deleted their account`,
      body: "Their data has been removed from Aleya. Archive any compliance notes if required.",
      actionLabel: "Open admin overview",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        userId: user.id,
      },
    }),
    buildEmail: ({ recipient, user }) => ({
      to: recipient.email,
      subject: `Account deleted: ${user.name || user.email}`,
      text: `Hi ${recipient.name || "there"},\n\n${
        user.name || user.email
      } deleted their Aleya account. Their journal data has been removed.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${recipient.name || "there"},</p>` +
        `<p><strong>${user.name || user.email}</strong> deleted their Aleya account. Their journal data has been removed.</p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  data_export_requested_user: {
    category: "exports",
    emailTemplate: "data_export_requested",
    buildInApp: ({ entryCount }) => ({
      title: "Your journal export is ready",
      body: entryCount
        ? `We generated a secure download with ${entryCount} reflections. Check your email for the link.`
        : "We generated your export. Check your email for the link.",
      actionLabel: "See email instructions",
      actionUrl: buildFrontendLink("/settings"),
      metadata: {
        entryCount,
      },
    }),
    buildEmail: ({ user, entryCount }) => ({
      to: user.email,
      subject: "Your Aleya data export",
      text: `Hi ${user.name || "there"},\n\nWe prepared your Aleya data export with ${
        entryCount || 0
      } journal entries. The download appeared in your browser just now. If you missed it, repeat the export from your settings page.\n\nFor your privacy the link expires once downloaded.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${user.name || "there"},</p>` +
        `<p>We prepared your Aleya data export with <strong>${entryCount || 0}</strong> journal entries.</p>` +
        `<p>The download started in your browser just now. If you missed it, repeat the export from your settings page.</p>` +
        `<p>For your privacy the link expires once downloaded.</p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  data_export_requested_admin: {
    category: "exports",
    emailTemplate: "data_export_audit",
    buildInApp: ({ user, entryCount }) => ({
      title: `${user.name || user.email} downloaded their data`,
      body: `${user.name || user.email} generated a journal export with ${
        entryCount || 0
      } entries.`,
      actionLabel: "Review account",
      actionUrl: buildFrontendLink("/dashboard"),
      metadata: {
        userId: user.id,
        entryCount,
      },
    }),
    buildEmail: ({ recipient, user, entryCount }) => ({
      to: recipient.email,
      subject: `Data export: ${user.name || user.email}`,
      text: `Hi ${recipient.name || "there"},\n\n${
        user.name || user.email
      } downloaded a journal export with ${entryCount || 0} entries.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${recipient.name || "there"},</p>` +
        `<p><strong>${user.name || user.email}</strong> downloaded a journal export with ${
          entryCount || 0
        } entries.</p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
  mentorship_ended_mentor: {
    category: "mentorship",
    emailTemplate: "mentorship_ended",
    buildInApp: ({ journaler }) => ({
      title: `${journaler.name || "A mentee"} ended the mentorship`,
      body: "The link was closed. Reflect together if you want to reconnect in the future.",
      actionLabel: "View mentorships",
      actionUrl: buildFrontendLink("/mentorship"),
      metadata: {
        journalerId: journaler.id,
      },
    }),
    buildEmail: ({ mentor, journaler }) => ({
      to: mentor.email,
      subject: `${journaler.name} ended your mentorship on Aleya`,
      text: `Hi ${mentor.name || "there"},\n\n${
        journaler.name
      } ended your mentorship link on Aleya. Take a moment to close the loop or share next steps if needed.\n\nRooted in care,\nThe Aleya team`,
      html: `<p>Hi ${mentor.name || "there"},</p>` +
        `<p><strong>${journaler.name}</strong> ended your mentorship link on Aleya.</p>` +
        `<p>Rooted in care,<br/>The Aleya team</p>`,
    }),
  },
};

async function dispatchNotification(app, templateKey, context) {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    logger.warn("Unknown notification template", { templateKey });
    return null;
  }

  const { recipient, ...rest } = context;
  if (!recipient || !recipient.id) {
    logger.warn("Notification missing recipient", { templateKey });
    return null;
  }

  const inAppEnabled = shouldSendInApp(
    recipient.notification_preferences,
    template.category
  );
  const emailEnabled = shouldSendEmail(
    recipient.notification_preferences,
    template.category
  );

  let notificationRecord = null;

  if (inAppEnabled) {
    const payload = template.buildInApp(rest);
    const insert = await pool.query(
      `INSERT INTO user_notifications (user_id, type, category, title, body, metadata, action_url, action_label, email_template)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
       RETURNING *`,
      [
        recipient.id,
        templateKey,
        template.category,
        payload.title,
        payload.body || null,
        JSON.stringify(payload.metadata || {}),
        payload.actionUrl || null,
        payload.actionLabel || null,
        template.emailTemplate || templateKey,
      ]
    );
    notificationRecord = insert.rows[0];
  }

  if (emailEnabled) {
    const emailMessage = template.buildEmail({ ...rest, recipient });
    await safeSend(app, emailMessage, {
      template: templateKey,
      recipientId: recipient.id,
    });
  }

  if (!inAppEnabled && !emailEnabled) {
    logger.info("Notification suppressed by preferences", {
      templateKey,
      recipientId: recipient.id,
    });
  }

  return notificationRecord;
}

async function notifyAdmins(app, templateKey, payloadBuilder) {
  const { rows } = await pool.query(
    `SELECT id, name, email, notification_preferences
     FROM users
     WHERE role = 'admin'`
  );

  return Promise.all(
    rows.map((admin) =>
      dispatchNotification(app, templateKey, {
        recipient: admin,
        ...payloadBuilder(admin),
      })
    )
  );
}

async function notifyMentorLink(app, { mentor, journaler }) {
  await Promise.all([
    dispatchNotification(app, "mentorship_linked_mentor", {
      recipient: mentor,
      mentor,
      journaler,
    }),
    dispatchNotification(app, "mentorship_linked_journaler", {
      recipient: journaler,
      mentor,
      journaler,
    }),
  ]);
}

async function notifyMentorEntry(app, { mentor, journaler, entry }) {
  const preferences = parsePreferences(mentor.notification_preferences);
  const maxLevel = preferences.mentorNotifications || "summary";
  const shaped = shapeEntryForMentor(entry, { maxLevel });

  if (!shaped || shaped.sharedLevel === "private") {
    return null;
  }

  return dispatchNotification(app, "mentor_entry_shared", {
    recipient: mentor,
    mentor,
    journaler,
    entry,
    shaped,
  });
}

async function notifyMentorPanic(app, { mentor, sender, message }) {
  return dispatchNotification(app, "mentor_panic_alert", {
    recipient: mentor,
    mentor,
    sender,
    message,
  });
}

module.exports = {
  notifyAdmins,
  notifyMentorLink,
  notifyMentorEntry,
  notifyMentorPanic,
  dispatchNotification,
  NOTIFICATION_TEMPLATES,
};
