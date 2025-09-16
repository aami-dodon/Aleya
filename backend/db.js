const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "true"
      ? { rejectUnauthorized: false }
      : undefined,
});

pool
  .connect()
  .then(async (client) => {
    try {
      const res = await client.query("SELECT NOW()");
      console.log("DB connected! Server time:", res.rows[0].now);
    } catch (error) {
      console.error("DB test query error:", error.stack);
    } finally {
      client.release();
    }
  })
  .catch((error) => {
    console.error("DB connection error:", error.stack);
  });

module.exports = pool;
