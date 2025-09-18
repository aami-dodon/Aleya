-- Aleya platform schema reference

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('journaler','mentor','admin')),
  timezone TEXT DEFAULT 'UTC',
  notification_preferences JSONB DEFAULT '{"reminders":{"daily":true,"weekly":true},"mentorNotifications":"summary"}',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token_hash TEXT,
  verification_token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_approvals (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  application JSONB,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  decided_at TIMESTAMPTZ,
  decided_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  expertise TEXT,
  availability TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_requests (
  id SERIAL PRIMARY KEY,
  journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','mentor_accepted','confirmed','declined','ended')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (journaler_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS mentor_links (
  id SERIAL PRIMARY KEY,
  journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  established_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (journaler_id, mentor_id)
);

CREATE TABLE IF NOT EXISTS journal_forms (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('default','mentor','admin')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_form_fields (
  id SERIAL PRIMARY KEY,
  form_id INTEGER NOT NULL REFERENCES journal_forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  required BOOLEAN DEFAULT FALSE,
  options JSONB DEFAULT '[]'::jsonb,
  helper_text TEXT
);

CREATE TABLE IF NOT EXISTS mentor_form_assignments (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  journaler_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  form_id INTEGER REFERENCES journal_forms(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (journaler_id, form_id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  journaler_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  form_id INTEGER NOT NULL REFERENCES journal_forms(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  responses JSONB NOT NULL,
  mood TEXT,
  shared_level TEXT NOT NULL DEFAULT 'private' CHECK (shared_level IN ('private','mood','summary','full')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mentor_notifications (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS entry_comments (
  id SERIAL PRIMARY KEY,
  entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  mentor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date ON journal_entries (journaler_id, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_notifications_mentor ON mentor_notifications (mentor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_assignments_journaler ON mentor_form_assignments (journaler_id);
CREATE INDEX IF NOT EXISTS idx_mentor_links_journaler ON mentor_links (journaler_id);
CREATE INDEX IF NOT EXISTS idx_mentor_approvals_status ON mentor_approvals (status);
