# Config

An example environment file lives at `backend/.env.example`; copy it to `.env` and update the values that differ for your setup.

## Core
- `PORT` – Express port (defaults to `5000`).
- `DATABASE_URL` – PostgreSQL connection string (required).
- `DATABASE_SSL` – Set to `true` to enable TLS when connecting to managed Postgres.
- `CORS_ORIGIN` – Comma-separated list of allowed origins for the API.
- `JWT_SECRET` – Secret used to sign auth tokens.

## Logging
- `LOG_FILE`, `LOG_LEVEL`, `LOG_MAX_SIZE`, `LOG_MAX_FILES` – Configure rolling log output via `utils/logger`.

## Bootstrap
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` – Optional credentials consumed by `utils/bootstrap.initializePlatform()` to create an admin and default forms.

## Email
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURE` – Required for Nodemailer transport validation at startup.
- `EMAIL_VERIFICATION_URL` – Optional absolute URL for verification links; defaults to `APP_BASE_URL`/`FRONTEND_URL`/`CORS_ORIGIN` fallback.
- `EMAIL_VERIFICATION_TTL_HOURS` – Overrides default 48h verification token lifetime.
- `PASSWORD_RESET_URL` – Optional absolute URL for password reset links; falls back to `APP_BASE_URL`/`FRONTEND_URL`/`CORS_ORIGIN`.
- `PASSWORD_RESET_TTL_HOURS` – Overrides the default 2h password reset token expiry window.
- `MENTOR_DIGEST_WINDOW_HOURS` – Controls look-back window for the mentor digest job.

## Client Coordination
- `APP_BASE_URL` / `FRONTEND_URL` – Used when constructing verification links if provided.
