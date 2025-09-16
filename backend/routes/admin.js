const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get(
  "/overview",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { rows: userCounts } = await pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE role = 'journaler') AS journalers,
           COUNT(*) FILTER (WHERE role = 'mentor') AS mentors,
           COUNT(*) FILTER (WHERE role = 'admin') AS admins
         FROM users`
      );

      const { rows: formCounts } = await pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_default) AS defaults
         FROM journal_forms`
      );

      const { rows: entryCounts } = await pool.query(
        `SELECT COUNT(*) AS total
         FROM journal_entries`
      );

      const { rows: linkCounts } = await pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE established_at >= NOW() - INTERVAL '30 days') AS recent
         FROM mentor_links`
      );

      const { rows: pendingRequests } = await pool.query(
        `SELECT COUNT(*) AS pending
         FROM mentor_requests
         WHERE status = 'pending'`
      );

      return res.json({
        users: userCounts[0] || {},
        forms: formCounts[0] || {},
        entries: entryCounts[0] || {},
        mentorLinks: linkCounts[0] || {},
        pendingRequests: Number(pendingRequests[0]?.pending || 0),
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/forms",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT f.id, f.title, f.description, f.visibility, f.is_default, f.created_at,
                u.name AS created_by_name,
                COUNT(mfa.*) AS assignments
         FROM journal_forms f
         LEFT JOIN users u ON u.id = f.created_by
         LEFT JOIN mentor_form_assignments mfa ON mfa.form_id = f.id
         GROUP BY f.id, u.name
         ORDER BY f.is_default DESC, f.created_at DESC`
      );

      return res.json({ forms: rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  "/forms/:id",
  authenticate,
  requireRole("admin"),
  [
    body("description").optional().isString(),
    body("visibility")
      .optional()
      .isIn(["default", "mentor", "admin"])
      .withMessage("Invalid visibility"),
    body("isDefault").optional().isBoolean(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = [];
    const values = [];
    let index = 1;

    if (req.body.description !== undefined) {
      updates.push(`description = $${index}`);
      values.push(req.body.description);
      index += 1;
    }

    if (req.body.visibility) {
      updates.push(`visibility = $${index}`);
      values.push(req.body.visibility);
      index += 1;
    }

    if (req.body.isDefault !== undefined) {
      updates.push(`is_default = $${index}`);
      values.push(req.body.isDefault);
      index += 1;
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No changes provided" });
    }

    values.push(req.params.id);

    try {
      await pool.query(
        `UPDATE journal_forms SET ${updates.join(", ")} WHERE id = $${index}`,
        values
      );

      const { rows } = await pool.query(
        `SELECT f.id, f.title, f.description, f.visibility, f.is_default, f.created_at,
                u.name AS created_by_name,
                COUNT(mfa.*) AS assignments
         FROM journal_forms f
         LEFT JOIN users u ON u.id = f.created_by
         LEFT JOIN mentor_form_assignments mfa ON mfa.form_id = f.id
         WHERE f.id = $1
         GROUP BY f.id, u.name`,
        [req.params.id]
      );

      return res.json({ form: rows[0] });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/mentors",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email,
                mp.expertise, mp.availability, mp.bio,
                COUNT(ml.*) AS mentee_count
         FROM users u
         LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
         LEFT JOIN mentor_links ml ON ml.mentor_id = u.id
         WHERE u.role = 'mentor'
         GROUP BY u.id, mp.expertise, mp.availability, mp.bio
         ORDER BY u.name`
      );

      return res.json({ mentors: rows });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
