const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { dispatchNotification, notifyMentorLink } = require("../utils/notifications");

const router = express.Router();

const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

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
  "/mentor-approvals",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const filters = [];
      const params = [];

      if (req.query.status) {
        const status = String(req.query.status).toLowerCase();

        if (!APPROVAL_STATUSES.includes(status)) {
          return res.status(400).json({ error: "Invalid status filter" });
        }

        params.push(status);
        filters.push(`ma.status = $${params.length}`);
      }

      const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

      const { rows } = await pool.query(
        `SELECT ma.*, u.name AS decided_by_name
         FROM mentor_approvals ma
         LEFT JOIN users u ON u.id = ma.decided_by
         ${whereClause}
         ORDER BY ma.requested_at DESC, ma.id DESC`,
        params
      );

      return res.json({ approvals: rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/mentor-approvals",
  authenticate,
  requireRole("admin"),
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("status")
      .optional()
      .isIn(APPROVAL_STATUSES)
      .withMessage("Invalid status"),
    body("name").optional().isString(),
    body("application")
      .optional()
      .custom((value) => value === null || typeof value === "object")
      .withMessage("Application must be an object"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const normalizedEmail = req.body.email.toLowerCase();
    const providedStatus = req.body.status
      ? req.body.status.toLowerCase()
      : "pending";
    const providedName =
      typeof req.body.name === "string" && req.body.name.trim().length
        ? req.body.name.trim()
        : null;
    const applicationPayload =
      req.body.application === undefined
        ? undefined
        : req.body.application === null
        ? null
        : req.body.application;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT id FROM mentor_approvals WHERE email = $1 FOR UPDATE`,
        [normalizedEmail]
      );

      let approval;
      const applicationValue =
        applicationPayload === undefined
          ? null
          : applicationPayload === null
          ? null
          : JSON.stringify(applicationPayload);

      if (!existing.rows.length) {
        const { rows } = await client.query(
          `INSERT INTO mentor_approvals (
             email,
             name,
             status,
             application,
             requested_at,
             decided_at,
             decided_by
           )
           VALUES ($1, $2, $3, $4, NOW(),
             CASE WHEN $3 <> 'pending' THEN NOW() ELSE NULL END,
             CASE WHEN $3 <> 'pending' THEN $5 ELSE NULL END)
           RETURNING *`,
          [
            normalizedEmail,
            providedName,
            providedStatus,
            applicationValue,
            providedStatus === "pending" ? null : req.user.id,
          ]
        );

        approval = rows[0];
      } else {
        const approvalId = existing.rows[0].id;
        const updates = [];
        const values = [];
        let index = 1;

        if (req.body.name !== undefined) {
          updates.push(`name = $${index}`);
          values.push(providedName);
          index += 1;
        }

        if (applicationPayload !== undefined) {
          updates.push(`application = $${index}`);
          values.push(applicationValue);
          index += 1;
        }

        if (req.body.status) {
          updates.push(`status = $${index}`);
          values.push(providedStatus);
          index += 1;

          if (providedStatus === "pending") {
            updates.push(`requested_at = NOW()`);
            updates.push(`decided_at = NULL`);
            updates.push(`decided_by = NULL`);
          } else {
            updates.push(`decided_at = NOW()`);
            updates.push(`decided_by = $${index}`);
            values.push(req.user.id);
            index += 1;
          }
        }

        if (!updates.length) {
          approval = (
            await client.query(
              `SELECT * FROM mentor_approvals WHERE id = $1`,
              [approvalId]
            )
          ).rows[0];
        } else {
          values.push(approvalId);
          const { rows } = await client.query(
            `UPDATE mentor_approvals
             SET ${updates.join(", ")}
             WHERE id = $${index}
             RETURNING *`,
            values
          );
          approval = rows[0];
        }
      }

      await client.query("COMMIT");

      const { rows: hydrated } = await client.query(
        `SELECT ma.*, u.name AS decided_by_name
         FROM mentor_approvals ma
         LEFT JOIN users u ON u.id = ma.decided_by
         WHERE ma.id = $1`,
        [approval.id]
      );

      const approvalRecord = hydrated[0];

      if (approvalRecord?.status && approvalRecord.status !== "pending") {
        const { rows: mentorUsers } = await pool.query(
          `SELECT id, name, email, notification_preferences
           FROM users
           WHERE email = $1`,
          [approvalRecord.email.toLowerCase()]
        );

        if (mentorUsers.length) {
          await dispatchNotification(req.app, "mentor_application_decision", {
            recipient: mentorUsers[0],
            mentor: mentorUsers[0],
            status: approvalRecord.status,
          });
        }
      }

      const statusCode = existing.rows.length ? 200 : 201;
      return res.status(statusCode).json({ approval: approvalRecord });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.patch(
  "/mentor-approvals/:id",
  authenticate,
  requireRole("admin"),
  [
    body("status")
      .optional()
      .isIn(APPROVAL_STATUSES)
      .withMessage("Invalid status"),
    body("name").optional().isString(),
    body("application")
      .optional()
      .custom((value) => value === null || typeof value === "object")
      .withMessage("Application must be an object"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const approvalId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(approvalId)) {
      return res.status(400).json({ error: "Invalid approval id" });
    }

    const providedName =
      typeof req.body.name === "string" && req.body.name.trim().length
        ? req.body.name.trim()
        : null;
    const applicationPayload =
      req.body.application === undefined
        ? undefined
        : req.body.application === null
        ? null
        : req.body.application;
    const providedStatus = req.body.status
      ? req.body.status.toLowerCase()
      : null;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT * FROM mentor_approvals WHERE id = $1 FOR UPDATE`,
        [approvalId]
      );

      if (!existing.rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Approval not found" });
      }

      const updates = [];
      const values = [];
      let index = 1;

      if (req.body.name !== undefined) {
        updates.push(`name = $${index}`);
        values.push(providedName);
        index += 1;
      }

      if (applicationPayload !== undefined) {
        updates.push(`application = $${index}`);
        values.push(
          applicationPayload === null
            ? null
            : JSON.stringify(applicationPayload)
        );
        index += 1;
      }

      if (providedStatus) {
        updates.push(`status = $${index}`);
        values.push(providedStatus);
        index += 1;

        if (providedStatus === "pending") {
          updates.push(`requested_at = NOW()`);
          updates.push(`decided_at = NULL`);
          updates.push(`decided_by = NULL`);
        } else {
          updates.push(`decided_at = NOW()`);
          updates.push(`decided_by = $${index}`);
          values.push(req.user.id);
          index += 1;
        }
      }

      if (!updates.length) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "No changes provided" });
      }

      values.push(approvalId);

      const { rows } = await client.query(
        `UPDATE mentor_approvals
         SET ${updates.join(", ")}
         WHERE id = $${index}
         RETURNING *`,
        values
      );

      const approval = rows[0];

      await client.query("COMMIT");

      const { rows: hydrated } = await client.query(
        `SELECT ma.*, u.name AS decided_by_name
         FROM mentor_approvals ma
         LEFT JOIN users u ON u.id = ma.decided_by
         WHERE ma.id = $1`,
        [approval.id]
      );

      const approvalRecord = hydrated[0];

      if (approvalRecord?.status && approvalRecord.status !== "pending") {
        const { rows: mentorUsers } = await pool.query(
          `SELECT id, name, email, notification_preferences
           FROM users
           WHERE email = $1`,
          [approvalRecord.email.toLowerCase()]
        );

        if (mentorUsers.length) {
          await dispatchNotification(req.app, "mentor_application_decision", {
            recipient: mentorUsers[0],
            mentor: mentorUsers[0],
            status: approvalRecord.status,
          });
        }
      }

      return res.json({ approval: approvalRecord });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
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

router.delete(
  "/forms/:id",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    const formId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(formId)) {
      return res.status(400).json({ error: "Invalid form id" });
    }

    try {
      const { rows } = await pool.query(
        `SELECT is_default FROM journal_forms WHERE id = $1`,
        [formId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Form not found" });
      }

      if (rows[0].is_default) {
        return res.status(400).json({ error: "Default forms cannot be deleted" });
      }

      await pool.query(`DELETE FROM journal_forms WHERE id = $1`, [formId]);

      return res.json({ success: true });
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
                COALESCE(
                  JSON_AGG(
                    DISTINCT JSONB_BUILD_OBJECT(
                      'id', j.id,
                      'name', j.name,
                      'email', j.email
                    )
                  ) FILTER (WHERE j.id IS NOT NULL),
                  '[]'
                ) AS mentees,
                COUNT(ml.*) AS mentee_count
         FROM users u
         LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
         LEFT JOIN mentor_links ml ON ml.mentor_id = u.id
         LEFT JOIN users j ON j.id = ml.journaler_id
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

router.get(
  "/journalers",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    const search = (req.query.q || "").trim().toLowerCase();
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 25, 100);

    try {
      const params = [limit];
      let whereClause = "WHERE role = 'journaler'";

      if (search) {
        params.push(`%${search}%`);
        whereClause +=
          " AND (LOWER(name) LIKE $2 OR LOWER(email) LIKE $2)";
      }

      const { rows } = await pool.query(
        `SELECT id, name, email
         FROM users
         ${whereClause}
         ORDER BY name
         LIMIT $1`,
        params
      );

      return res.json({ journalers: rows });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/mentor-links",
  authenticate,
  requireRole("admin"),
  [
    body("mentorId").isInt().withMessage("mentorId is required"),
    body("journalerEmail")
      .optional()
      .isEmail()
      .withMessage("A valid journalerEmail is required"),
    body("journalerId").optional().isInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const mentorId = Number.parseInt(req.body.mentorId, 10);
    const journalerId =
      req.body.journalerId !== undefined
        ? Number.parseInt(req.body.journalerId, 10)
        : null;
    const journalerEmail =
      typeof req.body.journalerEmail === "string"
        ? req.body.journalerEmail.toLowerCase()
        : null;

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    if (!journalerId && !journalerEmail) {
      return res
        .status(400)
        .json({ error: "journalerId or journalerEmail is required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows: mentorRows } = await client.query(
        `SELECT id, name, email, notification_preferences
         FROM users
         WHERE id = $1 AND role = 'mentor'
         FOR UPDATE`,
        [mentorId]
      );

      if (!mentorRows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Mentor not found" });
      }

      let journalerRow;

      if (journalerId) {
        const { rows } = await client.query(
          `SELECT id, name, email, notification_preferences
           FROM users
           WHERE id = $1 AND role = 'journaler'
           FOR UPDATE`,
          [journalerId]
        );

        if (!rows.length) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Journaler not found" });
        }

        journalerRow = rows[0];
      } else {
        const { rows } = await client.query(
          `SELECT id, name, email, notification_preferences
           FROM users
           WHERE LOWER(email) = $1 AND role = 'journaler'
           FOR UPDATE`,
          [journalerEmail]
        );

        if (!rows.length) {
          await client.query("ROLLBACK");
          return res.status(404).json({ error: "Journaler not found" });
        }

        journalerRow = rows[0];
      }

      const existingLink = await client.query(
        `SELECT id FROM mentor_links
         WHERE mentor_id = $1 AND journaler_id = $2
         FOR UPDATE`,
        [mentorId, journalerRow.id]
      );

      if (existingLink.rows.length) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Mentor and journaler are already linked" });
      }

      await client.query(
        `INSERT INTO mentor_links (journaler_id, mentor_id)
         VALUES ($1, $2)`,
        [journalerRow.id, mentorId]
      );

      await client.query(
        `UPDATE mentor_requests
         SET status = 'confirmed', updated_at = NOW()
         WHERE journaler_id = $1 AND mentor_id = $2 AND status <> 'confirmed'`,
        [journalerRow.id, mentorId]
      );

      await client.query("COMMIT");

      await notifyMentorLink(req.app, {
        mentor: mentorRows[0],
        journaler: journalerRow,
      });

      return res
        .status(201)
        .json({
          success: true,
          link: { mentorId, journalerId: journalerRow.id },
        });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.delete(
  "/mentor-links/:mentorId/:journalerId",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    const mentorId = Number.parseInt(req.params.mentorId, 10);
    const journalerId = Number.parseInt(req.params.journalerId, 10);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    if (!Number.isInteger(journalerId) || journalerId <= 0) {
      return res.status(400).json({ error: "Invalid journaler id" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT id FROM mentor_links
         WHERE mentor_id = $1 AND journaler_id = $2
         FOR UPDATE`,
        [mentorId, journalerId]
      );

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Mentor link not found" });
      }

      await client.query(
        `DELETE FROM mentor_links
         WHERE mentor_id = $1 AND journaler_id = $2`,
        [mentorId, journalerId]
      );

      await client.query(
        `UPDATE mentor_requests
         SET status = 'ended', updated_at = NOW()
         WHERE mentor_id = $1 AND journaler_id = $2 AND status = 'confirmed'`,
        [mentorId, journalerId]
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

router.delete(
  "/mentors/:id",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    const mentorId = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(mentorId) || mentorId <= 0) {
      return res.status(400).json({ error: "Invalid mentor id" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `SELECT id FROM users
         WHERE id = $1 AND role = 'mentor'
         FOR UPDATE`,
        [mentorId]
      );

      if (!rows.length) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Mentor not found" });
      }

      await client.query(`DELETE FROM users WHERE id = $1`, [mentorId]);

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

module.exports = router;
