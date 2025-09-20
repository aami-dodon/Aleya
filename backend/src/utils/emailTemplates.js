const SUBJECT_PREFIX = "[Aleya]";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const SHARE_LEVEL_LABELS = {
  mood: "Mood",
  summary: "Summary",
  full: "Full",
};

const SHARE_LEVEL_DESCRIPTIONS = {
  mood: "They opened their mood so you can sense how they're arriving today.",
  summary: "They offered a gentle summary of what surfaced in their reflection.",
  full: "They opened their full reflection for your care and insight.",
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailLayout({ title, previewText, contentHtml, footerHtml }) {
  const safeTitle = escapeHtml(title || "Aleya");
  const safePreviewText = escapeHtml(previewText || "Rooted in care with Aleya.");
  const resolvedFooter =
    footerHtml !== undefined
      ? String(footerHtml)
      : '<p class="paragraph">Rooted in care,<br/>The Aleya team</p>';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
    <style>
      :root {
        color-scheme: light dark;
      }

      body {
        margin: 0;
        background: #f7f5f2;
        font-family: "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        color: #1f2933;
      }

      a {
        color: #2f855a;
      }

      .preheader {
        display: none;
        visibility: hidden;
        opacity: 0;
        height: 0;
        width: 0;
        overflow: hidden;
        mso-hide: all;
      }

      .wrapper {
        padding: 32px 16px 48px;
      }

      .card {
        margin: 0 auto;
        max-width: 640px;
        background: #ffffff;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(47, 133, 90, 0.18);
        box-shadow: 0 28px 60px rgba(31, 41, 55, 0.12);
      }

      .header {
        background: radial-gradient(circle at top left, #2f855a, #276749);
        padding: 32px 36px;
        color: #f0fff4;
      }

      .brand {
        font-size: 18px;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        font-weight: 600;
      }

      .subtitle {
        margin-top: 8px;
        font-size: 16px;
        color: rgba(240, 255, 244, 0.8);
      }

      .content {
        padding: 36px;
      }

      .paragraph {
        margin: 0 0 18px;
        line-height: 1.65;
        font-size: 16px;
        color: inherit;
      }

      .paragraph.muted {
        color: #4b5563;
        font-size: 15px;
      }

      .cta {
        margin: 28px 0 32px;
      }

      .button {
        display: inline-block;
        padding: 14px 28px;
        border-radius: 999px;
        background: #2f855a;
        color: #f7fafc !important;
        text-decoration: none;
        font-weight: 600;
        box-shadow: 0 16px 30px rgba(47, 133, 90, 0.28);
      }

      .button:hover {
        background: #276749;
      }

      .link-alt {
        display: inline-block;
        margin-top: 6px;
        word-break: break-word;
        color: #276749;
        font-weight: 500;
      }

      .footer {
        padding: 0 36px 36px;
        font-size: 14px;
        color: #6b7280;
        text-align: center;
      }

      .footer a {
        color: #2f855a;
        text-decoration: none;
      }

      @media (prefers-color-scheme: dark) {
        body {
          background: #0f172a;
          color: #e2e8f0;
        }

        .card {
          background: #1f2937;
          border-color: rgba(148, 163, 184, 0.28);
          box-shadow: 0 32px 60px rgba(15, 23, 42, 0.5);
        }

        .subtitle {
          color: rgba(226, 232, 240, 0.75);
        }

        .paragraph {
          color: #e2e8f0;
        }

        .paragraph.muted {
          color: #cbd5f5;
        }

        .footer {
          color: #94a3b8;
        }

        .link-alt {
          color: #7dd3fc;
        }
      }
    </style>
  </head>
  <body>
    <div class="preheader">${safePreviewText}</div>
    <div class="wrapper">
      <div class="card">
        <div class="header">
          <div class="brand">Aleya</div>
          <div class="subtitle">${safePreviewText}</div>
        </div>
        <div class="content">
          ${contentHtml}
          ${resolvedFooter}
        </div>
      </div>
      <div class="footer">
        You are receiving this email because an Aleya account was created using
        this address.
      </div>
    </div>
  </body>
</html>`;
}

function normalizeName(value, fallback) {
  if (typeof value === "string" && value.trim().length) {
    return value.trim();
  }

  return fallback;
}

function formatDateLabel(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return DATE_FORMATTER.format(date);
}

function buildEntryDetails({ sharedLevel, mood, summary, responses }) {
  const htmlParts = [];
  const textLines = [];

  if (sharedLevel !== "private" && mood) {
    const safeMood = escapeHtml(String(mood));
    htmlParts.push(`<p class="paragraph"><strong>Mood:</strong> ${safeMood}</p>`);
    textLines.push(`Mood: ${mood}`);
  }

  if ((sharedLevel === "summary" || sharedLevel === "full") && summary) {
    const safeSummary = escapeHtml(String(summary));
    htmlParts.push(`<p class="paragraph"><strong>Summary:</strong> ${safeSummary}</p>`);
    textLines.push(`Summary: ${summary}`);
  }

  if (sharedLevel === "full" && Array.isArray(responses)) {
    const responseItems = responses
      .filter((item) => item && item.value !== null && item.value !== "")
      .map((item) => ({
        label: String(item.label || ""),
        value: String(item.value),
      }));

    if (responseItems.length) {
      htmlParts.push('<p class="paragraph"><strong>Reflection details</strong></p>');
      const listItems = responseItems
        .map(
          (item) =>
            `<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(
              item.value
            )}</li>`
        )
        .join("");
      htmlParts.push(`<ul class="paragraph">${listItems}</ul>`);

      textLines.push("Reflection details:");
      responseItems.forEach((item) => {
        textLines.push(`- ${item.label}: ${item.value}`);
      });
    }
  }

  return {
    html: htmlParts.join(""),
    text: textLines.join("\n"),
  };
}

function createMentorEntryNotificationEmail({
  mentorName,
  journalerName,
  entryDate,
  formTitle,
  shareLevel,
  mood,
  summary,
  responses,
}) {
  const recipientName = normalizeName(mentorName, "there");
  const menteeName = normalizeName(journalerName, "your mentee");
  const safeRecipient = escapeHtml(recipientName);
  const safeMentee = escapeHtml(menteeName);

  const levelLabel = SHARE_LEVEL_LABELS[shareLevel] || "Mood";
  const levelDescription =
    SHARE_LEVEL_DESCRIPTIONS[shareLevel] ||
    "They shared a new glimmer from their practice.";

  const whenLabel = formatDateLabel(entryDate);
  const safeFormTitle = formTitle ? escapeHtml(formTitle) : "reflection";
  const whenHtml = whenLabel ? ` on ${escapeHtml(whenLabel)}` : "";

  const details = buildEntryDetails({
    sharedLevel: shareLevel,
    mood,
    summary,
    responses,
  });

  const contentHtml = `
    <p class="paragraph">Hi ${safeRecipient},</p>
    <p class="paragraph">
      ${safeMentee} just completed the ${safeFormTitle}${whenHtml} and chose
      the ${escapeHtml(levelLabel)} sharing level.
      ${escapeHtml(levelDescription)}
    </p>
    ${details.html || ""}
    <p class="paragraph">
      Sign in to Aleya to explore the reflection further and share a gentle
      reply.
    </p>
  `;

  const textLines = [
    `Hi ${recipientName},`,
    `${menteeName} just completed the ${formTitle || "reflection"}` +
      (whenLabel ? ` on ${whenLabel}` : "") +
      ` and chose the ${levelLabel} sharing level. ${levelDescription}`,
  ];

  if (details.text) {
    textLines.push("", details.text);
  }

  textLines.push(
    "",
    "Sign in to Aleya to explore the reflection further and share a gentle reply.",
    "",
    "Rooted in care,",
    "The Aleya team"
  );

  const text = textLines.join("\n");

  const html = renderEmailLayout({
    title: `${levelLabel} update from ${menteeName}`,
    previewText: `${menteeName} just shared a ${levelLabel.toLowerCase()} update.`,
    contentHtml,
  });

  const subject = `${SUBJECT_PREFIX} New reflection from ${menteeName}`;

  return {
    subject,
    text,
    html,
  };
}

function createMentorDigestEmail({ mentorName, periodLabel, entryCount, mentees }) {
  const recipientName = normalizeName(mentorName, "there");
  const safeRecipient = escapeHtml(recipientName);
  const safePeriod = escapeHtml(periodLabel || "the recent period");
  const count = Number.isFinite(entryCount) ? entryCount : 0;
  const entryWord = count === 1 ? "reflection" : "reflections";

  const menteeSections = (mentees || [])
    .filter((mentee) => mentee && Array.isArray(mentee.entries))
    .map((mentee) => {
      const name = normalizeName(mentee.journalerName, "Your mentee");
      const safeName = escapeHtml(name);

      const entryBlocks = mentee.entries
        .map((entry) => {
          const levelLabel = SHARE_LEVEL_LABELS[entry.sharedLevel] || "Mood";
          const whenLabel = formatDateLabel(entry.entryDate || entry.createdAt);
          const safeFormTitle = entry.formTitle ? escapeHtml(entry.formTitle) : null;

          const details = buildEntryDetails(entry);

          const headerParts = [escapeHtml(levelLabel)];
          if (whenLabel) {
            headerParts.push(escapeHtml(whenLabel));
          }
          if (safeFormTitle) {
            headerParts.push(safeFormTitle);
          }

          const header = headerParts.join(" · ");

          const htmlBlock = `
            <div class="paragraph"><strong>${header}</strong></div>
            ${details.html || ""}
          `;

          const textLines = [header];
          if (details.text) {
            textLines.push(details.text);
          }

          return { html: htmlBlock, text: textLines.join("\n") };
        })
        .filter((block) => block); // Remove undefined blocks

      const html = [
        `<p class="paragraph"><strong>${safeName}</strong></p>`,
        entryBlocks.map((block) => block.html).join(""),
      ].join("");

      const textLines = [name];
      entryBlocks.forEach((block) => {
        textLines.push("", block.text);
      });

      return {
        html,
        text: textLines.join("\n"),
      };
    });

  const sectionsHtml = menteeSections
    .map((section) => section.html)
    .join('<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>');

  const sectionsText = menteeSections.map((section) => section.text).join("\n\n---\n\n");

  const contentHtml = `
    <p class="paragraph">Hi ${safeRecipient},</p>
    <p class="paragraph">
      Here's a gentle digest of ${count} ${entryWord} shared between ${safePeriod}.
    </p>
    ${sectionsHtml || '<p class="paragraph">No shared reflections in this window.</p>'}
    <p class="paragraph">
      Sign in to Aleya to continue supporting your mentees and respond with
      encouragement.
    </p>
  `;

  const textLines = [
    `Hi ${recipientName},`,
    `Here's a gentle digest of ${count} ${entryWord} shared between ${periodLabel || "the recent period"}.`,
  ];

  if (sectionsText) {
    textLines.push("", sectionsText);
  } else {
    textLines.push("", "No shared reflections in this window.");
  }

  textLines.push(
    "",
    "Sign in to Aleya to continue supporting your mentees and respond with encouragement.",
    "",
    "Rooted in care,",
    "The Aleya team"
  );

  const text = textLines.join("\n");

  const html = renderEmailLayout({
    title: "Mentee reflection digest",
    previewText: `${count} ${entryWord} shared between ${periodLabel || "the recent period"}.`,
    contentHtml,
  });

  const subject = `${SUBJECT_PREFIX} ${count} ${entryWord} from your mentees`;

  return {
    subject,
    text,
    html,
  };
}

function createVerificationEmail({ recipientName, verificationUrl, expiresText }) {
  const normalizedName =
    typeof recipientName === "string" && recipientName.trim().length
      ? recipientName.trim()
      : "there";
  const safeName = escapeHtml(normalizedName);
  const safeExpires = escapeHtml(expiresText);
  const safeUrl = escapeHtml(verificationUrl);

  const contentHtml = `
    <p class="paragraph">Hi ${safeName},</p>
    <p class="paragraph">
      Thanks for joining Aleya. Please confirm your email address to complete
      your registration and begin tending your practice.
    </p>
    <div class="cta">
      <a class="button" href="${verificationUrl}">Verify email address</a>
    </div>
    <p class="paragraph muted">
      If the button above doesn't open, copy and paste this link into your
      browser:
      <span class="link-alt">${safeUrl}</span>
    </p>
    <p class="paragraph">
      This link expires in ${safeExpires}. If you didn't create an account, you
      can safely ignore this email.
    </p>
  `;

  const html = renderEmailLayout({
    title: "Verify your email address",
    previewText: "Confirm your email address to complete your Aleya registration.",
    contentHtml,
  });

  const text =
    `Hi ${normalizedName},\n\n` +
    "Thanks for joining Aleya. Please confirm your email address by visiting the link below:\n" +
    `${verificationUrl}\n\n` +
    `This link expires in ${expiresText}. If you didn't create an account, you can safely ignore this email.\n\n` +
    "Rooted in care,\nThe Aleya team";

  return {
    subject: `${SUBJECT_PREFIX} Verify your email address`,
    text,
    html,
  };
}

module.exports = {
  SUBJECT_PREFIX,
  escapeHtml,
  renderEmailLayout,
  createVerificationEmail,
  createMentorEntryNotificationEmail,
  createMentorDigestEmail,
};
