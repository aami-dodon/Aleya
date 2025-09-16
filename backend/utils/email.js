const REQUIRED_ENV_VARS = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  throw new Error(
    "SMTP_SECURE must be one of: true, false, 1, 0, yes, no"
  );
}

function extractEmailAddress(value) {
  const match = String(value).match(/<([^>]+)>/);
  if (match) {
    return match[1];
  }
  return String(value).trim();
}

function validateMailSettings(env = process.env) {
  const missing = REQUIRED_ENV_VARS.filter((key) => {
    const value = env[key];
    return value === undefined || String(value).trim() === "";
  });

  if (missing.length) {
    throw new Error(
      `Missing SMTP configuration values: ${missing.join(", ")}`
    );
  }

  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a positive integer");
  }

  const secure = parseBoolean(env.SMTP_SECURE, port === 465);

  const fromAddress = extractEmailAddress(env.SMTP_FROM);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(fromAddress)) {
    throw new Error("SMTP_FROM must contain a valid email address");
  }

  return {
    host: String(env.SMTP_HOST).trim(),
    port,
    secure,
    auth: {
      user: String(env.SMTP_USER),
      pass: String(env.SMTP_PASSWORD),
    },
    from: String(env.SMTP_FROM).trim(),
  };
}

module.exports = {
  validateMailSettings,
};
