# Database

## Connection
- Managed via `backend/src/db.js` using `pg.Pool`.
- Requires `DATABASE_URL`; optional `DATABASE_SSL=true` enables TLS with `rejectUnauthorized: false`.
- Logs successful connection time and surfaces errors through `utils/logger`.

## Schema
- Canonical reference lives in `backend/docs/schema.sql` (see [Models](./models.md)).
- Tables cover users, mentor profiles/requests/links, journal forms + fields, assignments, entries, and entry comments.

## Migrations & Seeding
- No migration framework bundled; apply `schema.sql` manually or via external tools.
- `backend/src/utils/bootstrap.js` initialises default admin and form templates when env vars are provided.

## Jobs
- `backend/src/jobs/sendMentorDigest.js` queries recent entries and emails mentors according to `MENTOR_DIGEST_WINDOW_HOURS`.
