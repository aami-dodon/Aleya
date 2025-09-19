const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const resolvedLogFile = path.resolve(
  __dirname,
  "..",
  process.env.LOG_FILE || "logs/aleya.log"
);

const logDirectory = path.dirname(resolvedLogFile);
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const fileTransport = new transports.File({
  filename: resolvedLogFile,
  maxsize: parseInt(process.env.LOG_MAX_SIZE || "5242880", 10), // 5 MB
  maxFiles: parseInt(process.env.LOG_MAX_FILES || "5", 10),
});

const consoleTransport = new transports.Console({
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.printf((info) => {
      const { timestamp, level, message, stack } = info;
      const splat = info[Symbol.for("splat")] || [];
      const splatString = splat
        .map((value) =>
          typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)
        )
        .join(" ");

      const meta = { ...info };
      delete meta.timestamp;
      delete meta.level;
      delete meta.message;
      delete meta.stack;

      const metaKeys = Object.keys(meta);
      const metaString = metaKeys.length
        ? ` ${JSON.stringify(
            metaKeys.reduce((acc, key) => ({ ...acc, [key]: meta[key] }), {})
          )}`
        : "";

      const baseMessage = stack || message;
      const extras = splatString ? ` ${splatString}` : "";

      return `${timestamp} ${level}: ${baseMessage}${extras}${metaString}`;
    })
  ),
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [fileTransport, consoleTransport],
});

logger.stream = {
  write(message) {
    logger.info(message.trim());
  },
};

function serializeError(error) {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  return error;
}

module.exports = {
  logger,
  resolvedLogFile,
  serializeError,
};
