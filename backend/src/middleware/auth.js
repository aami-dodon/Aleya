const jwt = require("jsonwebtoken");
const pool = require("../db");
const { logger } = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT id, email, name, role, timezone
       FROM users WHERE id = $1`,
      [payload.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    logger.warn(
      "Authentication error on %s: %s (%s)",
      req.originalUrl,
      error.message,
      error.name
    );
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
