const bcrypt = require("bcryptjs");
const pool = require("../db");
const { logger } = require("./logger");
const { MOOD_OPTIONS } = require("./mood");

const DEFAULT_NOTIFICATION_PREFS = {
  reminders: {
    daily: true,
    weekly: true,
  },
  mentorNotifications: "summary",
};

const createTableStatements = [
  `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('journaler','mentor','admin')),
      timezone TEXT DEFAULT 'UTC',
      notification_preferences JSONB DEFAULT '${JSON.stringify(
        DEFAULT_NOTIFICATION_PREFS
      )}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS mentor_profiles (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      expertise TEXT,
      availability TEXT,
      bio TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS mentor_requests (
      id SERIAL PRIMARY KEY,
      journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','mentor_accepted','confirmed','declined')),
      message TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (journaler_id, mentor_id)
    )`,
  `CREATE TABLE IF NOT EXISTS mentor_links (
      id SERIAL PRIMARY KEY,
      journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      established_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (journaler_id, mentor_id)
    )`,
  `CREATE TABLE IF NOT EXISTS journal_forms (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      visibility TEXT NOT NULL CHECK (visibility IN ('default','mentor','admin')),
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS journal_form_fields (
      id SERIAL PRIMARY KEY,
      form_id INTEGER NOT NULL REFERENCES journal_forms(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      field_type TEXT NOT NULL,
      required BOOLEAN DEFAULT FALSE,
      options JSONB DEFAULT '[]'::jsonb,
      helper_text TEXT
    )`,
  `CREATE TABLE IF NOT EXISTS mentor_form_assignments (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      journaler_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      form_id INTEGER REFERENCES journal_forms(id) ON DELETE CASCADE,
      assigned_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (journaler_id, form_id)
    )`,
  `CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      form_id INTEGER NOT NULL REFERENCES journal_forms(id) ON DELETE CASCADE,
      entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
      responses JSONB NOT NULL,
      mood TEXT,
      shared_level TEXT NOT NULL DEFAULT 'private' CHECK (shared_level IN ('private','mood','summary','full')),
      summary TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS mentor_notifications (
      id SERIAL PRIMARY KEY,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      visibility TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      read_at TIMESTAMPTZ
    )`,
  `CREATE TABLE IF NOT EXISTS entry_comments (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      comment TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
  `CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries (journaler_id, entry_date DESC)` ,
  `CREATE INDEX IF NOT EXISTS idx_mentor_notifications_mentor ON mentor_notifications (mentor_id, created_at DESC)` ,
  `CREATE INDEX IF NOT EXISTS idx_mentor_assignments_journaler ON mentor_form_assignments (journaler_id)` ,
  `CREATE INDEX IF NOT EXISTS idx_mentor_links_journaler ON mentor_links (journaler_id)`
];

const DEFAULT_FORM = {
  title: "Daily Roots Check-In",
  description:
    "A gentle, holistic prompt to help you acknowledge your emotions, notice your habits, and tend to your wellbeing.",
  fields: [
    {
      label: "Mood",
      fieldType: "select",
      required: true,
      options: MOOD_OPTIONS,
      helperText: "Which word reflects how you feel right now?",
    },
    {
      label: "What caused today's emotions?",
      fieldType: "textarea",
      required: false,
      helperText: "Moments, interactions, or reflections that influenced your mood.",
    },
    {
      label: "What did I learn today?",
      fieldType: "textarea",
      required: false,
      helperText: "Insights, gratitude, or a small win worth remembering.",
    },
    {
      label: "Sleep quality",
      matchLabels: ["Sleep quality (1-5)"],
      fieldType: "select",
      required: false,
      options: [
        { value: "high", label: "High" },
        { value: "medium", label: "Steady" },
        { value: "low", label: "Low" },
      ],
      helperText: "Optional check-in with your rest and recovery.",
    },
    {
      label: "Energy level",
      fieldType: "select",
      required: false,
      options: [
        { value: "high", label: "High" },
        { value: "medium", label: "Steady" },
        { value: "low", label: "Low" },
      ],
      helperText: "Optional gauge of how energized or drained you feel.",
    },
    {
      label: "Notable activities",
      fieldType: "textarea",
      required: false,
      helperText: "Habits, movement, creativity, or connections that shaped your day.",
    },
  ],
};

async function ensureSchema() {
  for (const statement of createTableStatements) {
    // eslint-disable-next-line no-await-in-loop
    await pool.query(statement);
  }
}

async function ensureDefaultForm() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM journal_forms WHERE is_default = TRUE LIMIT 1"
    );

    let formId;

    if (!existing.rows.length) {
      const inserted = await client.query(
        `INSERT INTO journal_forms (title, description, visibility, is_default)
         VALUES ($1, $2, 'default', TRUE)
         RETURNING id`,
        [DEFAULT_FORM.title, DEFAULT_FORM.description]
      );
      formId = inserted.rows[0].id;

      // insert default fields
      for (const field of DEFAULT_FORM.fields) {
        // eslint-disable-next-line no-await-in-loop
        await client.query(
          `INSERT INTO journal_form_fields
            (form_id, label, field_type, required, options, helper_text)
           VALUES ($1, $2, $3, $4, $5, $6)`,
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
    } else {
      formId = existing.rows[0].id;
      for (const field of DEFAULT_FORM.fields) {
        const labelsToMatch = Array.from(
          new Set([field.label, ...(field.matchLabels || [])])
        );

        // eslint-disable-next-line no-await-in-loop
        const fieldCheck = await client.query(
          `SELECT id FROM journal_form_fields
             WHERE form_id = $1 AND label = ANY($2::text[])
             LIMIT 1`,
          [formId, labelsToMatch]
        );

        const params = [
          field.label,
          field.fieldType,
          field.required || false,
          JSON.stringify(field.options || []),
          field.helperText || null,
        ];

        if (!fieldCheck.rows.length) {
          // eslint-disable-next-line no-await-in-loop
          await client.query(
            `INSERT INTO journal_form_fields
              (form_id, label, field_type, required, options, helper_text)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [formId, ...params]
          );
        } else {
          // eslint-disable-next-line no-await-in-loop
          await client.query(
            `UPDATE journal_form_fields
                SET label = $2,
                    field_type = $3,
                    required = $4,
                    options = $5,
                    helper_text = $6
             WHERE id = $1`,
            [fieldCheck.rows[0].id, ...params]
          );
        }
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function ensureAdminAccount() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    return;
  }

  const name = process.env.SEED_ADMIN_NAME || "Aleya Admin";

  const { rows } = await pool.query("SELECT id FROM users WHERE email = $1", [
    email.toLowerCase(),
  ]);

  if (rows.length) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'admin')`,
    [email.toLowerCase(), passwordHash, name]
  );
  logger.info("Seeded default admin account for %s", email);
}

async function initializePlatform() {
  await ensureSchema();
  await ensureDefaultForm();
  await ensureAdminAccount();
}

module.exports = {
  initializePlatform,
  ensureSchema,
  ensureDefaultForm,
  DEFAULT_NOTIFICATION_PREFS,
};
