const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { DEFAULT_NOTIFICATION_PREFS } = require("../utils/bootstrap");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const ALLOWED_ROLES = ["journaler", "mentor", "admin"];

async function fetchUserById(id) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.timezone, u.notification_preferences,
            mp.expertise, mp.availability, mp.bio
     FROM users u
     LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
     WHERE u.id = $1`,
    [id]
  );

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  let notificationPreferences =
    row.notification_preferences || DEFAULT_NOTIFICATION_PREFS;

  if (typeof notificationPreferences === "string") {
    try {
      notificationPreferences = JSON.parse(notificationPreferences);
    } catch (error) {
      notificationPreferences = DEFAULT_NOTIFICATION_PREFS;
    }
  }

  if (!notificationPreferences) {
    notificationPreferences = DEFAULT_NOTIFICATION_PREFS;
  }

  notificationPreferences = JSON.parse(
    JSON.stringify(notificationPreferences)
  );

  const user = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    timezone: row.timezone,
    notificationPreferences,
  };

  if (row.role === "mentor") {
    user.mentorProfile = {
      expertise: row.expertise || "",
      availability: row.availability || "",
      bio: row.bio || "",
    };
  }

  return user;
}

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }

  return true;
}

router.post(
  "/register",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("role")
      .optional()
      .isIn(ALLOWED_ROLES)
      .withMessage("Invalid role"),
  ],
  async (req, res, next) => {
    if (!handleValidation(req, res)) return;

    const client = await pool.connect();
    const {
      email,
      password,
      name,
      role: requestedRole,
      timezone,
      mentorProfile,
    } = req.body;

    const normalizedEmail = email.toLowerCase();
    const role = requestedRole && ALLOWED_ROLES.includes(requestedRole)
      ? requestedRole
      : "journaler";

    try {
      await client.query("BEGIN");

      const existing = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [normalizedEmail]
      );

      if (existing.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const inserted = await client.query(
        `INSERT INTO users (email, password_hash, name, role, timezone, notification_preferences)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          normalizedEmail,
          passwordHash,
          name,
          role,
          timezone || "UTC",
          JSON.stringify(DEFAULT_NOTIFICATION_PREFS),
        ]
      );

      const userId = inserted.rows[0].id;

      if (role === "mentor") {
        const profile = mentorProfile || {};
        await client.query(
          `INSERT INTO mentor_profiles (user_id, expertise, availability, bio)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id)
           DO UPDATE SET
             expertise = EXCLUDED.expertise,
             availability = EXCLUDED.availability,
             bio = EXCLUDED.bio,
             updated_at = NOW()`,
          [
            userId,
            profile.expertise || null,
            profile.availability || null,
            profile.bio || null,
          ]
        );
      }

      await client.query("COMMIT");

      const user = await fetchUserById(userId);
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.status(201).json({ token, user });
    } catch (error) {
      await client.query("ROLLBACK");
      return next(error);
    } finally {
      client.release();
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail(),
    body("password").notEmpty(),
  ],
  async (req, res, next) => {
    if (!handleValidation(req, res)) return;

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    try {
      const { rows } = await pool.query(
        `SELECT id, password_hash FROM users WHERE email = $1`,
        [normalizedEmail]
      );

      if (!rows.length) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const [userRow] = rows;
      const isValid = await bcrypt.compare(password, userRow.password_hash);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = await fetchUserById(userRow.id);
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return res.json({ token, user });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  "/magic-link",
  [body("email").isEmail().withMessage("Email is required")],
  async (req, res) => {
    if (!handleValidation(req, res)) return;

    // The actual email delivery would be implemented with an email provider.
    // We simply acknowledge the request for now.
    res.json({
      message:
        "Magic link requested. In production this would email a secure login link.",
    });
  }
);

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await fetchUserById(req.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", authenticate, async (req, res, next) => {
  const { name, timezone, notificationPreferences, password, mentorProfile } =
    req.body;

  try {
    const updates = [];
    const values = [];
    let index = 1;

    if (name) {
      updates.push(`name = $${index}`);
      values.push(name);
      index += 1;
    }

    if (timezone) {
      updates.push(`timezone = $${index}`);
      values.push(timezone);
      index += 1;
    }

    if (notificationPreferences) {
      updates.push(`notification_preferences = $${index}`);
      values.push(JSON.stringify(notificationPreferences));
      index += 1;
    }

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push(`password_hash = $${index}`);
      values.push(passwordHash);
      index += 1;
    }

    if (updates.length) {
      const setClause = `${updates.join(", ")}, updated_at = NOW()`;
      values.push(req.user.id);
      await pool.query(
        `UPDATE users SET ${setClause} WHERE id = $${index}`,
        values
      );
    }

    if (req.user.role === "mentor" && mentorProfile) {
      await pool.query(
        `INSERT INTO mentor_profiles (user_id, expertise, availability, bio)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id)
         DO UPDATE SET
           expertise = EXCLUDED.expertise,
           availability = EXCLUDED.availability,
           bio = EXCLUDED.bio,
           updated_at = NOW()`,
        [
          req.user.id,
          mentorProfile.expertise || null,
          mentorProfile.availability || null,
          mentorProfile.bio || null,
        ]
      );
    }

    const user = await fetchUserById(req.user.id);
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/mentor/profiles",
  authenticate,
  requireRole("admin"),
  async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT u.id, u.email, u.name, mp.expertise, mp.availability, mp.bio
         FROM users u
         LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
         WHERE u.role = 'mentor'
         ORDER BY u.name`
      );

      return res.json({ mentors: rows });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
