const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

module.exports = async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT id, email, name, role, timezone, notification_preferences
       FROM users WHERE id = $1`,
      [payload.id]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "User not found" });
    }

    const user = rows[0];
    if (typeof user.notification_preferences === "string") {
      try {
        user.notification_preferences = JSON.parse(
          user.notification_preferences
        );
      } catch (parseError) {
        user.notification_preferences = {};
      }
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
