const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

function formatRequests(rows) {
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    journaler: {
      id: row.journaler_id,
      name: row.journaler_name,
      email: row.journaler_email,
    },
    mentor: {
      id: row.mentor_id,
      name: row.mentor_name,
      email: row.mentor_email,
    },
  }));
}

router.get("/", authenticate, async (req, res, next) => {
  const search = (req.query.q || "").trim();
  const limit = Math.min(Number(req.query.limit) || 25, 100);

  try {
    const params = [];
    let whereClause = "WHERE u.role = 'mentor'";

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause +=
        " AND (LOWER(u.name) LIKE $1 OR LOWER(u.email) LIKE $1 OR LOWER(COALESCE(mp.expertise,'')) LIKE $1)";
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, mp.expertise, mp.availability, mp.bio
       FROM users u
       LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
       ${whereClause}
       ORDER BY u.name
       LIMIT ${limit}`,
      params
    );

    return res.json({ mentors: rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/requests", authenticate, async (req, res, next) => {
  const { role, id } = req.user;

  try {
    if (role === "mentor") {
      const { rows } = await pool.query(
        `SELECT mr.*, j.id AS journaler_id, j.name AS journaler_name, j.email AS journaler_email,
                m.id AS mentor_id, m.name AS mentor_name, m.email AS mentor_email
         FROM mentor_requests mr
         JOIN users j ON j.id = mr.journaler_id
         JOIN users m ON m.id = mr.mentor_id
         WHERE mr.mentor_id = $1
         ORDER BY mr.created_at DESC`,
        [id]
      );

      return res.json({ requests: formatRequests(rows) });
    }

    if (role === "journaler") {
      const { rows } = await pool.query(
        `SELECT mr.*, j.id AS journaler_id, j.name AS journaler_name, j.email AS journaler_email,
                m.id AS mentor_id, m.name AS mentor_name, m.email AS mentor_email
         FROM mentor_requests mr
         JOIN users j ON j.id = mr.journaler_id
         JOIN users m ON m.id = mr.mentor_id
         WHERE mr.journaler_id = $1
         ORDER BY mr.created_at DESC`,
        [id]
      );

      return res.json({ requests: formatRequests(rows) });
    }

    return res.json({ requests: [] });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/requests",
  authenticate,
  requireRole("journaler"),
  [
    body("mentorId").isInt().withMessage("mentorId is required"),
    body("message").optional().isString().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mentorId, message } = req.body;

    if (mentorId === req.user.id) {
      return res.status(400).json({ error: "You cannot request yourself as a mentor" });
    }

    try {
      const mentor = await pool.query(
        `SELECT id FROM users WHERE id = $1 AND role = 'mentor'`,
        [mentorId]
      );

      if (!mentor.rows.length) {
        return res.status(404).json({ error: "Mentor not found" });
      }

      const existingLink = await pool.query(
        `SELECT id FROM mentor_links WHERE journaler_id = $1 AND mentor_id = $2`,
        [req.user.id, mentorId]
      );

      if (existingLink.rows.length) {
        return res.status(400).json({ error: "You are already linked with this mentor" });
      }

      await pool.query(
        `INSERT INTO mentor_requests (journaler_id, mentor_id, message)
         VALUES ($1, $2, $3)
         ON CONFLICT (journaler_id, mentor_id)
         DO UPDATE SET status = 'pending', message = EXCLUDED.message, updated_at = NOW()` ,
        [req.user.id, mentorId, message || null]
      );

      return res.status(201).json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/requests/:id/accept",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `UPDATE mentor_requests
         SET status = 'mentor_accepted', updated_at = NOW()
         WHERE id = $1 AND mentor_id = $2 AND status = 'pending'
         RETURNING id`,
        [req.params.id, req.user.id]
      );

      if (!result.rowCount) {
        return res.status(404).json({ error: "Request not found or already processed" });
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/requests/:id/confirm",
  authenticate,
  requireRole("journaler"),
  async (req, res, next) => {
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT * FROM mentor_requests
         WHERE id = $1 AND journaler_id = $2 AND status = 'mentor_accepted'
         FOR UPDATE`,
        [req.params.id, req.user.id]
      );

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Request not ready for confirmation" });
      }

      const request = rows[0];

      await client.query(
        `UPDATE mentor_requests
         SET status = 'confirmed', updated_at = NOW()
         WHERE id = $1`,
        [req.params.id]
      );

      await client.query(
        `INSERT INTO mentor_links (journaler_id, mentor_id)
         VALUES ($1, $2)
         ON CONFLICT (journaler_id, mentor_id) DO NOTHING`,
        [request.journaler_id, request.mentor_id]
      );

      await client.query("COMMIT");
      return res.json({ success: true });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.post(
  "/requests/:id/decline",
  authenticate,
  async (req, res, next) => {
    const { role, id } = req.user;

    try {
      const result = await pool.query(
        `UPDATE mentor_requests
         SET status = 'declined', updated_at = NOW()
         WHERE id = $1 AND ((mentor_id = $2 AND $3 = 'mentor') OR (journaler_id = $2 AND $3 = 'journaler'))
         RETURNING id`,
        [req.params.id, id, role]
      );

      if (!result.rowCount) {
        return res.status(404).json({ error: "Request not found" });
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/mentees",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT ml.id, ml.established_at,
                j.id AS journaler_id, j.name AS journaler_name, j.email AS journaler_email,
                je.id AS latest_entry_id, je.entry_date AS latest_entry_date,
                je.mood AS latest_mood, je.summary AS latest_summary, je.shared_level
         FROM mentor_links ml
         JOIN users j ON j.id = ml.journaler_id
         LEFT JOIN LATERAL (
            SELECT e.id, e.entry_date, e.mood, e.summary, e.shared_level
            FROM journal_entries e
            WHERE e.journaler_id = j.id
            ORDER BY e.created_at DESC
            LIMIT 1
         ) je ON TRUE
         WHERE ml.mentor_id = $1
         ORDER BY j.name`,
        [req.user.id]
      );

      const mentees = rows.map((row) => ({
        id: row.journaler_id,
        name: row.journaler_name,
        email: row.journaler_email,
        establishedAt: row.established_at,
        latestEntry: row.latest_entry_id
          ? {
              id: row.latest_entry_id,
              entryDate: row.latest_entry_date,
              mood: row.latest_mood,
              summary: row.latest_summary,
              sharedLevel: row.shared_level,
            }
          : null,
      }));

      return res.json({ mentees });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/notifications",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT mn.id, mn.entry_id, mn.visibility, mn.created_at, mn.read_at,
                je.entry_date, je.mood, je.summary, je.shared_level,
                j.id AS journaler_id, j.name AS journaler_name
         FROM mentor_notifications mn
         JOIN journal_entries je ON je.id = mn.entry_id
         JOIN users j ON j.id = je.journaler_id
         WHERE mn.mentor_id = $1
         ORDER BY mn.created_at DESC
         LIMIT 50`,
        [req.user.id]
      );

      const notifications = rows.map((row) => ({
        id: row.id,
        entryId: row.entry_id,
        visibility: row.visibility,
        createdAt: row.created_at,
        readAt: row.read_at,
        journaler: {
          id: row.journaler_id,
          name: row.journaler_name,
        },
        entry: {
          entryDate: row.entry_date,
          mood: row.mood,
          summary: row.summary,
          sharedLevel: row.shared_level,
        },
      }));

      return res.json({ notifications });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/notifications/:id/read",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const result = await pool.query(
        `UPDATE mentor_notifications
         SET read_at = NOW()
         WHERE id = $1 AND mentor_id = $2
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
