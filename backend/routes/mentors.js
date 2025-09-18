const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { sendMentorLinkEmails, sendMentorPanicEmail } = require("../utils/notifications");

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

      const { rows: participants } = await client.query(
        `SELECT id, name, email
         FROM users
         WHERE id = ANY($1::int[])`,
        [[request.journaler_id, request.mentor_id]]
      );

      await client.query("COMMIT");

      const mentor = participants.find(
        (user) => user.id === request.mentor_id
      );
      const journaler = participants.find(
        (user) => user.id === request.journaler_id
      );

      if (mentor && journaler) {
        await sendMentorLinkEmails(req.app, {
          mentor: {
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
          },
          journaler: {
            id: journaler.id,
            name: journaler.name,
            email: journaler.email,
          },
        });
      }

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

router.delete(
  "/links/:mentorId",
  authenticate,
  requireRole("journaler"),
  [body("password").isString().notEmpty().withMessage("Password is required")],
  async (req, res, next) => {
    const mentorId = Number(req.params.mentorId);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { rows } = await pool.query(
        `SELECT password_hash FROM users WHERE id = $1`,
        [req.user.id]
      );

      if (!rows.length) {
        return res.status(401).json({ error: "User not found" });
      }

      const isValid = await bcrypt.compare(req.body.password, rows[0].password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Incorrect password" });
      }

      const client = await pool.connect();

      try {
        await client.query("BEGIN");

        const link = await client.query(
          `SELECT id FROM mentor_links
           WHERE journaler_id = $1 AND mentor_id = $2
           FOR UPDATE`,
          [req.user.id, mentorId]
        );

        if (!link.rows.length) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Mentor link not found" });
        }

        await client.query(
          `DELETE FROM mentor_links WHERE journaler_id = $1 AND mentor_id = $2`,
          [req.user.id, mentorId]
        );

        await client.query(
          `UPDATE mentor_requests
           SET status = 'ended', updated_at = NOW()
           WHERE journaler_id = $1 AND mentor_id = $2 AND status = 'confirmed'`,
          [req.user.id, mentorId]
        );

        await client.query(
          `DELETE FROM mentor_form_assignments
           WHERE journaler_id = $1 AND mentor_id = $2`,
          [req.user.id, mentorId]
        );

        await client.query(
          `DELETE FROM mentor_notifications
           WHERE mentor_id = $2
             AND entry_id IN (
               SELECT id FROM journal_entries WHERE journaler_id = $1
             )`,
          [req.user.id, mentorId]
        );

        await client.query("COMMIT");
        return res.json({ success: true });
      } catch (error) {
        await client.query("ROLLBACK");
        return next(error);
      } finally {
        client.release();
      }
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
  "/support-network",
  authenticate,
  requireRole("mentor"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email
         FROM mentor_links ml
         JOIN users u ON u.id = ml.mentor_id
         WHERE ml.journaler_id = $1
         ORDER BY u.name`,
        [req.user.id]
      );

      return res.json({ mentors: rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.get(
  "/notifications",
  authenticate,
  requireRole("mentor", "journaler", "admin"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT mn.id, mn.type, mn.entry_id, mn.visibility, mn.payload, mn.created_at, mn.read_at,
                je.entry_date, je.mood, je.summary, je.shared_level,
                j.id AS journaler_id, j.name AS journaler_name
         FROM mentor_notifications mn
         LEFT JOIN journal_entries je ON je.id = mn.entry_id
         LEFT JOIN users j ON j.id = je.journaler_id
         WHERE mn.mentor_id = $1
         ORDER BY mn.created_at DESC
         LIMIT 50`,
        [req.user.id]
      );

      const notifications = rows.map((row) => ({
        id: row.id,
        type: row.type || "entry",
        entryId: row.entry_id,
        visibility: row.visibility,
        createdAt: row.created_at,
        readAt: row.read_at,
        journaler: row.journaler_id
          ? {
              id: row.journaler_id,
              name: row.journaler_name,
            }
          : null,
        entry:
          row.entry_id && row.entry_date
            ? {
                entryDate: row.entry_date,
                mood: row.mood,
                summary: row.summary,
                sharedLevel: row.shared_level,
              }
            : null,
        payload: row.payload || {},
      }));

      return res.json({ notifications });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/panic-alerts",
  authenticate,
  requireRole("mentor"),
  [
    body("mentorId").isInt({ gt: 0 }).withMessage("mentorId is required"),
    body("message")
      .isString()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage("A short message is required"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorId = Number(req.body.mentorId);
    const message = req.body.message.trim();

    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.name, u.email
         FROM mentor_links ml
         JOIN users u ON u.id = ml.mentor_id
         WHERE ml.journaler_id = $1 AND ml.mentor_id = $2`,
        [req.user.id, mentorId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Mentor link not found" });
      }

      const targetMentor = rows[0];
      const payload = {
        senderId: req.user.id,
        senderName: req.user.name,
        senderEmail: req.user.email,
        message,
      };

      const { rows: inserted } = await pool.query(
        `INSERT INTO mentor_notifications (mentor_id, type, visibility, payload)
         VALUES ($1, 'panic_alert', 'panic', $2::jsonb)
         RETURNING id, created_at`,
        [targetMentor.id, JSON.stringify(payload)]
      );

      await sendMentorPanicEmail(req.app, {
        mentor: targetMentor,
        sender: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
        },
        message,
      });

      return res.status(201).json({
        success: true,
        notification: {
          id: inserted[0].id,
          createdAt: inserted[0].created_at,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/notifications/:id/read",
  authenticate,
  requireRole("mentor", "journaler", "admin"),
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
