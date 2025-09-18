const SUBJECT_PREFIX = "[Aleya]";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderEmailLayout({
  title,
  previewText,
  contentHtml,
  footerHtml,
}) {
  const safeTitle = escapeHtml(title || "Aleya");
  const safePreviewText = escapeHtml(
    previewText || "Rooted in care with Aleya."
  );
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

function createVerificationEmail({
  recipientName,
  verificationUrl,
  expiresText,
}) {
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
    previewText:
      "Confirm your email address to complete your Aleya registration.",
    contentHtml,
  });

  const text = `Hi ${normalizedName},\n\n` +
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
};
