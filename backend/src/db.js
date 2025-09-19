const { Pool } = require("pg");

const { logger, serializeError } = require("./utils/logger");

if (!process.env.DATABASE_URL) {
  const error = new Error("DATABASE_URL environment variable is not defined");
  logger.error(error.message);
  throw error;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool
  .connect()
  .then(async (client) => {
    try {
      const res = await client.query("SELECT NOW()");
      logger.info("Connected to database. Server time: %s", res.rows[0].now);
    } catch (error) {
      logger.error("DB test query error", { error: serializeError(error) });
    } finally {
      client.release();
    }
  })
  .catch((error) => {
    logger.error("DB connection error", { error: serializeError(error) });
  });

module.exports = pool;
