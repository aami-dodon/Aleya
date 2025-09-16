const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const pool = require("../db");
const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const { DEFAULT_NOTIFICATION_PREFS } = require("../utils/bootstrap");
const { logger } = require("../utils/logger");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";
const REGISTER_ROLES = ["journaler", "mentor"];

const DEFAULT_VERIFICATION_TOKEN_TTL_HOURS = 48;

function resolveVerificationTtlHours() {
  const raw = process.env.EMAIL_VERIFICATION_TTL_HOURS;
  if (!raw) {
    return DEFAULT_VERIFICATION_TOKEN_TTL_HOURS;
  }

  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_VERIFICATION_TOKEN_TTL_HOURS;
  }

  return parsed;
}

const VERIFICATION_TOKEN_TTL_HOURS = resolveVerificationTtlHours();

function getMailTransporter(app) {
  if (!app?.locals?.mailSettings) {
    throw new Error("Mail settings are not configured");
  }

  if (!app.locals.mailTransporter) {
    app.locals.mailTransporter = nodemailer.createTransport(
      app.locals.mailSettings
    );
  }

  return app.locals.mailTransporter;
}

function buildVerificationLink(token) {
  const explicit = process.env.EMAIL_VERIFICATION_URL;

  if (explicit) {
    try {
      const url = new URL(explicit);
      url.searchParams.set("token", token);
      return url.toString();
    } catch (error) {
      logger.warn("Invalid EMAIL_VERIFICATION_URL configured: %s", explicit, {
        error: error.message,
      });
    }
  }

  const fallbackBase =
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL ||
    (process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")[0].trim()
      : null) ||
    "http://localhost:3000";

  try {
    const baseUrl = new URL(fallbackBase);
    const trimmedPath = baseUrl.pathname.replace(/\/$/, "");
    baseUrl.pathname = `${trimmedPath}/verify-email`;
    baseUrl.searchParams.set("token", token);
    return baseUrl.toString();
  } catch (error) {
    return `http://localhost:3000/verify-email?token=${encodeURIComponent(
      token
    )}`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendVerificationEmail(app, { email, name }, token) {
  const transporter = getMailTransporter(app);
  const verificationUrl = buildVerificationLink(token);

  const displayName = name ? name.trim() : "there";
  const safeName = escapeHtml(displayName || "there");
  const expiresText =
    VERIFICATION_TOKEN_TTL_HOURS === 1
      ? "1 hour"
      : `${VERIFICATION_TOKEN_TTL_HOURS} hours`;

  await transporter.sendMail({
    to: email,
    from: app.locals.mailSettings.from,
    subject: "Verify your Aleya email address",
    text: `Hi ${displayName || "there"},\n\n` +
      "Thanks for joining Aleya. Please confirm your email address by visiting the link below:\n" +
      `${verificationUrl}\n\n` +
      `The link expires in ${expiresText}. If you didn't create an account, you can safely ignore this message.\n\n` +
      "Rooted in care,\nThe Aleya team",
    html: `<p>Hi ${safeName},</p>` +
      `<p>Thanks for joining Aleya. Please confirm your email address by clicking the button below.</p>` +
      `<p><a href="${verificationUrl}" style="display:inline-block;padding:12px 20px;background:#2f855a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600">Verify email</a></p>` +
      `<p>This link expires in ${escapeHtml(
        expiresText
      )}. If you didn't create an account you can safely ignore this email.</p>` +
      `<p>Rooted in care,<br/>The Aleya team</p>`,
  });

  logger.info("Sent verification email to %s", email);
}

async function fetchUserById(id) {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.timezone, u.notification_preferences,
            u.is_verified,
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
    isVerified: row.is_verified,
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
    body("confirmPassword")
      .notEmpty()
      .withMessage("Please retype your password")
      .bail()
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords must match"),
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("role")
      .optional()
      .isIn(REGISTER_ROLES)
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
    const role =
      requestedRole && REGISTER_ROLES.includes(requestedRole)
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
      const verificationToken = crypto.randomBytes(32).toString("hex");
      const verificationTokenHash = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");
      const verificationExpiresAt = new Date(
        Date.now() + VERIFICATION_TOKEN_TTL_HOURS * 60 * 60 * 1000
      );

      const inserted = await client.query(
        `INSERT INTO users (
            email,
            password_hash,
            name,
            role,
            timezone,
            notification_preferences,
            is_verified,
            verification_token_hash,
            verification_token_expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, FALSE, $7, $8)
         RETURNING id`,
        [
          normalizedEmail,
          passwordHash,
          name,
          role,
          timezone || "UTC",
          JSON.stringify(DEFAULT_NOTIFICATION_PREFS),
          verificationTokenHash,
          verificationExpiresAt,
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

      await sendVerificationEmail(
        req.app,
        { email: normalizedEmail, name },
        verificationToken
      );

      await client.query("COMMIT");

      return res.status(201).json({
        message:
          "Account created. Please verify your email address to complete registration.",
        email: normalizedEmail,
        verificationExpiresAt: verificationExpiresAt.toISOString(),
        verificationExpiresInHours: VERIFICATION_TOKEN_TTL_HOURS,
      });
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
        `SELECT id, password_hash, is_verified FROM users WHERE email = $1`,
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

      if (userRow.is_verified === false) {
        return res
          .status(403)
          .json({ error: "Please verify your email before signing in." });
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
  "/verify-email",
  [body("token").trim().notEmpty().withMessage("Verification token is required")],
  async (req, res, next) => {
    if (!handleValidation(req, res)) return;

    const { token } = req.body;
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    try {
      const { rows } = await pool.query(
        `SELECT id, email, name, is_verified, verification_token_expires_at
         FROM users
         WHERE verification_token_hash = $1`,
        [tokenHash]
      );

      if (!rows.length) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification link." });
      }

      const user = rows[0];

      if (user.is_verified) {
        await pool.query(
          `UPDATE users
             SET verification_token_hash = NULL,
                 verification_token_expires_at = NULL,
                 updated_at = NOW()
           WHERE id = $1`,
          [user.id]
        );

        return res.json({
          message: "Email already verified. You can sign in.",
        });
      }

      const expiresAt = user.verification_token_expires_at
        ? new Date(user.verification_token_expires_at)
        : null;

      if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
        return res.status(400).json({
          error:
            "Verification link has expired. Please register again to receive a new link.",
        });
      }

      if (expiresAt.getTime() < Date.now()) {
        return res.status(400).json({
          error:
            "Verification link has expired. Please register again to receive a new link.",
        });
      }

      await pool.query(
        `UPDATE users
           SET is_verified = TRUE,
               verification_token_hash = NULL,
               verification_token_expires_at = NULL,
               updated_at = NOW()
         WHERE id = $1`,
        [user.id]
      );

      logger.info("Verified email for %s", user.email);

      return res.json({
        message: "Email verified. You can now sign in.",
      });
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
