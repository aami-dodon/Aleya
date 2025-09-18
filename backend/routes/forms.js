const express = require("express");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const {
  notifyAdmins,
  dispatchNotification,
} = require("../utils/notifications");

const router = express.Router();

const fieldValidators = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("fields")
    .isArray({ min: 1 })
    .withMessage("At least one field is required"),
];

function parseJsonColumn(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value;
  }

  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

async function fetchForms(whereClause = "", params = []) {
  const query = `
    SELECT f.id,
           f.title,
           f.description,
           f.visibility,
           f.is_default,
           f.created_by,
           f.created_at,
           COALESCE(
             json_agg(
               json_build_object(
                 'id', fld.id,
                 'label', fld.label,
                 'fieldType', fld.field_type,
                 'required', fld.required,
                 'options', fld.options,
                 'helperText', fld.helper_text
               )
               ORDER BY fld.id
             ) FILTER (WHERE fld.id IS NOT NULL),
             '[]'
           ) AS fields
    FROM journal_forms f
    LEFT JOIN journal_form_fields fld ON fld.form_id = f.id
    ${whereClause}
    GROUP BY f.id
    ORDER BY f.is_default DESC, f.created_at DESC
  `;

  const { rows } = await pool.query(query, params);

  return rows.map((row) => ({
    ...row,
    fields: parseJsonColumn(row.fields, []),
  }));
}

async function fetchJournalerAssignments(journalerId) {
  const { rows } = await pool.query(
    `SELECT mfa.form_id,
            mfa.assigned_at,
            mentor.id AS mentor_id,
            mentor.name AS mentor_name
     FROM mentor_form_assignments mfa
     LEFT JOIN users mentor ON mentor.id = mfa.mentor_id
     WHERE mfa.journaler_id = $1`,
    [journalerId]
  );

  return rows.reduce((map, row) => {
    map.set(row.form_id, {
      assignedAt: row.assigned_at,
      mentorId: row.mentor_id,
      mentorName: row.mentor_name,
    });
    return map;
  }, new Map());
}

router.get("/default", async (req, res, next) => {
  try {
    const forms = await fetchForms("WHERE f.is_default = TRUE");
    if (!forms.length) {
      return res.status(404).json({ error: "Default form not found" });
    }

    return res.json({ form: forms[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/", authenticate, async (req, res, next) => {
  try {
    const { role, id } = req.user;

    if (role === "journaler") {
      const [forms, assignments] = await Promise.all([
        fetchForms(
          `WHERE f.is_default = TRUE
             OR f.id IN (
               SELECT form_id FROM mentor_form_assignments WHERE journaler_id = $1
             )`,
          [id]
        ),
        fetchJournalerAssignments(id),
      ]);

      const enriched = forms.map((form) => ({
        ...form,
        assignment: assignments.get(form.id) || null,
      }));

      return res.json({ forms: enriched });
    }

    if (role === "mentor") {
      const forms = await fetchForms(
        `WHERE f.visibility IN ('default','admin')
           OR f.created_by = $1`,
        [id]
      );
      return res.json({ forms });
    }

    if (role === "admin") {
      const forms = await fetchForms();
      return res.json({ forms });
    }

    return res.json({ forms: [] });
  } catch (error) {
    return next(error);
  }
});

router.post(
  "/",
  authenticate,
  requireRole("mentor", "admin"),
  fieldValidators,
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, fields } = req.body;
    const visibility = req.user.role === "admin" ? "admin" : "mentor";
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const inserted = await client.query(
        `INSERT INTO journal_forms (title, description, created_by, visibility, is_default)
         VALUES ($1, $2, $3, $4, FALSE)
         RETURNING id`,
        [title, description || null, req.user.id, visibility]
      );

      const formId = inserted.rows[0].id;

      for (const field of fields) {
        if (!field || !field.label || !field.fieldType) {
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        await client.query(
          `INSERT INTO journal_form_fields (form_id, label, field_type, required, options, helper_text)
           VALUES ($1, $2, $3, $4, $5, $6)` ,
          [
            formId,
            field.label,
            field.fieldType,
            field.required || false,
            JSON.stringify(field.options || []),
            field.helperText || null,
          ]
        );
      }

      await client.query("COMMIT");

      const [form] = await fetchForms("WHERE f.id = $1", [formId]);

      if (req.user.role === "mentor" && form) {
        await notifyAdmins(req.app, "form_review_required", () => ({
          form,
          creator: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          },
        }));
      }

      return res.status(201).json({ form });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.post(
  "/:formId/assign",
  authenticate,
  requireRole("mentor", "admin"),
  [body("journalerId").isInt().withMessage("journalerId is required")],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { formId } = req.params;
    const { journalerId } = req.body;

    try {
      const { rows } = await pool.query(
        "SELECT id, created_by, visibility FROM journal_forms WHERE id = $1",
        [formId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Form not found" });
      }

      const form = rows[0];

      if (
        req.user.role === "mentor" &&
        form.visibility === "mentor" &&
        form.created_by !== req.user.id
      ) {
        return res.status(403).json({ error: "You can only assign your own forms" });
      }

      if (req.user.role === "mentor") {
        const link = await pool.query(
          `SELECT id FROM mentor_links WHERE mentor_id = $1 AND journaler_id = $2`,
          [req.user.id, journalerId]
        );

        if (!link.rows.length) {
          return res.status(403).json({
            error: "A mentorship link must be established before assigning forms",
          });
        }
      }

      await pool.query(
        `INSERT INTO mentor_form_assignments (mentor_id, journaler_id, form_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (journaler_id, form_id)
         DO UPDATE SET mentor_id = EXCLUDED.mentor_id, assigned_at = NOW()` ,
        [req.user.id, journalerId, formId]
      );

      const { rows: journalerRows } = await pool.query(
        `SELECT id, name, email, notification_preferences FROM users WHERE id = $1`,
        [journalerId]
      );

      const [fullForm] = await fetchForms("WHERE f.id = $1", [formId]);

      if (journalerRows.length && fullForm) {
        await dispatchNotification(req.app, "form_assignment_journaler", {
          recipient: journalerRows[0],
          mentor: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            notification_preferences: req.user.notification_preferences,
          },
          journaler: journalerRows[0],
          form: fullForm,
        });
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:formId/assign/:journalerId",
  authenticate,
  requireRole("mentor", "admin"),
  async (req, res, next) => {
    const { formId, journalerId } = req.params;

    try {
      await pool.query(
        `DELETE FROM mentor_form_assignments
         WHERE form_id = $1 AND journaler_id = $2`,
        [formId, journalerId]
      );

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

router.delete(
  "/:formId/assignment",
  authenticate,
  requireRole("journaler"),
  async (req, res, next) => {
    const { formId } = req.params;

    try {
      const { rows } = await pool.query(
        "SELECT is_default FROM journal_forms WHERE id = $1",
        [formId]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Form not found" });
      }

      if (rows[0].is_default) {
        return res
          .status(400)
          .json({ error: "The default form cannot be unlinked" });
      }

      const result = await pool.query(
        `DELETE FROM mentor_form_assignments
         WHERE journaler_id = $1 AND form_id = $2
         RETURNING id`,
        [req.user.id, formId]
      );

      if (!result.rows.length) {
        return res
          .status(404)
          .json({ error: "Form assignment not found" });
      }

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
