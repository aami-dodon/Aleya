# Backend Change Log

## Container session resets (2025-09-24)
- Each API process now issues a unique `X-Aleya-Boot-Id` header generated at startup. Clients use this identifier to detect
  container restarts and invalidate cached authentication state.
- Added `GET /api/auth/session` to surface the current boot identifier without requiring authentication so the frontend can
  clear stale tokens before making privileged requests.

## Mentor form stewardship (2025-09-21)
- Mentors can now update their custom forms via `PUT /api/forms/:formId`. The handler validates ownership, replaces the field definitions inside a transaction, and keeps default templates locked down.
- Mentors can now delete their own forms with `DELETE /api/forms/:formId`. The route rejects attempts against default templates or forms created by other users.
- Frontend builder now loads mentor forms for editing, lets guides refresh prompts, and surfaces delete controls that call the new endpoints.
