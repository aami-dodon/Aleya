# Backend Change Log

## Mentor form stewardship (2025-09-21)
- Mentors can now update their custom forms via `PUT /api/forms/:formId`. The handler validates ownership, replaces the field definitions inside a transaction, and keeps default templates locked down.
- Mentors can now delete their own forms with `DELETE /api/forms/:formId`. The route rejects attempts against default templates or forms created by other users.
- Frontend builder now loads mentor forms for editing, lets guides refresh prompts, and surfaces delete controls that call the new endpoints.
