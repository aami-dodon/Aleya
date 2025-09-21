# Backend Change Log

## Password reset confirmations (2025-10-29)
- Added `POST /api/auth/reset-password` to validate hashed tokens, rotate the
  requesting user's password, and clear the matching `password_reset_tokens`
  row after a successful change.
- Frontend now exposes `/reset-password` so emailed links land on the in-app
  reset form. The view guides people through choosing a new password and links
  them back to sign-in after a successful refresh.

## Password reset invitations (2025-09-30)
- Added `POST /api/auth/forgot-password` to generate time-bound reset tokens, persist them in
  `password_reset_tokens`, and email mentors or journalers a themed reset link via the mailer.
- Bootstrapping now provisions the `password_reset_tokens` table and supporting indexes so
  container starts automatically enforce expiry and lookup integrity.

## Container session resets (2025-09-24)
- Each API process now issues a unique `X-Aleya-Boot-Id` header generated at startup. Clients use this identifier to detect
  container restarts and invalidate cached authentication state.
- Added `GET /api/auth/session` to surface the current boot identifier without requiring authentication so the frontend can
  clear stale tokens before making privileged requests.

## Mentor form stewardship (2025-09-21)
- Mentors can now update their custom forms via `PUT /api/forms/:formId`. The handler validates ownership, replaces the field definitions inside a transaction, and keeps default templates locked down.
- Mentors can now delete their own forms with `DELETE /api/forms/:formId`. The route rejects attempts against default templates or forms created by other users.
- Frontend builder now loads mentor forms for editing, lets guides refresh prompts, and surfaces delete controls that call the new endpoints.
