const express = require("express");
const pool = require("../db");
const authenticate = require("../middleware/auth");

const router = express.Router();

function parseMetadata(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
}

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, type, category, title, body, metadata, action_url, action_label, email_template, created_at, read_at
       FROM user_notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const notifications = rows.map((row) => ({
      id: row.id,
      type: row.type,
      category: row.category,
      title: row.title,
      body: row.body,
      action: row.action_url
        ? { url: row.action_url, label: row.action_label || "View" }
        : null,
      metadata: parseMetadata(row.metadata),
      emailTemplate: row.email_template,
      createdAt: row.created_at,
      readAt: row.read_at,
    }));

    return res.json({ notifications });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/:id/read",
  authenticate,
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `UPDATE user_notifications
         SET read_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (!result.rowCount) {
        return res.status(404).json({ error: "Notification not found" });
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
