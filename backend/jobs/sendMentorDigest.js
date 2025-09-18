require("dotenv").config();

const pool = require("../db");
const { validateMailSettings } = require("../utils/email");
const { logger, serializeError } = require("../utils/logger");
const {
  dispatchMentorDigests,
} = require("../services/mentorNotifications");

const RANGE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function parseWindowHours(value) {
  if (value === undefined || value === null || value === "") {
    return 24;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 24;
  }

  return parsed;
}

function formatRangeLabel(since, until) {
  const start = RANGE_FORMATTER.format(since);
  const end = RANGE_FORMATTER.format(until);

  if (start === end) {
    return start;
  }

  return `${start} – ${end}`;
}

async function run() {
  const windowHours = parseWindowHours(process.env.MENTOR_DIGEST_WINDOW_HOURS);
  const now = new Date();
  const since = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  let mailSettings;

  try {
    mailSettings = validateMailSettings();
  } catch (error) {
    logger.error("Mentor digest aborted: invalid SMTP configuration", {
      error: serializeError(error),
    });
    process.exit(1);
  }

  const appContext = { locals: { mailSettings } };

  try {
    await dispatchMentorDigests(appContext, {
      since,
      until: now,
      periodLabel: formatRangeLabel(since, now),
    });
    logger.info("Mentor digest job completed", {
      since: since.toISOString(),
      until: now.toISOString(),
      windowHours,
    });
  } catch (error) {
    logger.error("Mentor digest job failed", {
      error: serializeError(error),
    });
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run().catch((error) => {
  logger.error("Mentor digest job crashed", {
    error: serializeError(error),
  });
  process.exit(1);
});
