# Routes

- **/api/auth** → `backend/src/routes/auth.js`
  - Registration, login, email verification, profile CRUD, mentor expertise suggestions, admin mentor profile export.
- **/api/forms** → `backend/src/routes/forms.js`
  - Fetch default/assigned forms, mentor form creation + assignment management, journaler/admin listing.
- **/api/mentors** → `backend/src/routes/mentors.js`
  - Mentor directory search, mentorship requests, journaler confirmations, link teardown, support network + panic alerts.
- **/api/journal-entries** → `backend/src/routes/journal.js`
  - Entry creation/edit/delete, mentor comments, CSV export, admin search filters.
- **/api/dashboard** → `backend/src/routes/dashboard.js`
  - Journaler streaks + wellbeing metrics, mentor mentee overviews.
- **/api/admin** → `backend/src/routes/admin.js`
  - Org-wide stats, form stewardship, mentor/journaler management, journal moderation.
