const nodemailer = require("nodemailer");
const { logger } = require("./logger");

function getMailTransporter(app) {
  if (!app?.locals?.mailSettings) {
    throw new Error("Mail settings are not configured");
  }

  if (!app.locals.mailTransporter) {
    app.locals.mailTransporter = nodemailer.createTransport(
      app.locals.mailSettings
    );
  }

  return app.locals.mailTransporter;
}

async function sendEmail(app, message, context = {}) {
  const transporter = getMailTransporter(app);

  try {
    await transporter.sendMail({
      from: app.locals.mailSettings.from,
      ...message,
    });
  } catch (error) {
    logger.error("Failed to send email", {
      error: error.message,
      context,
    });
    throw error;
  }
}

module.exports = {
  getMailTransporter,
  sendEmail,
};
