# Services

## mentorNotifications
- **Location:** `backend/src/services/mentorNotifications.js`
- **Responsibilities:**
  - Fetch linked mentors for a journaler, shape entry payloads, and send transactional emails via `utils/mailer` + `emailTemplates` when entries are shared.
  - Build mentor digest payloads for scheduled jobs, grouping entries by mentor and mentee.
- **Consumers:** `journal` routes for immediate notifications, `jobs/sendMentorDigest.js` for periodic digests.

## utils/emailTemplates
- **Location:** `backend/src/utils/emailTemplates.js`
- **Role:** Centralises HTML/text templates for verification, mentor entry alerts, and digest emails to keep Aleya branding consistent.

## utils/mailer
- **Location:** `backend/src/utils/mailer.js`
- **Role:** Wraps Nodemailer transport creation with SMTP settings stored in `app.locals.mailSettings` for re-use across services.

## utils/metrics
- **Location:** `backend/src/utils/metrics.js`
- **Role:** Calculates streaks, averages, mood/wellbeing trends, and crisis keyword detection used by dashboard controllers.
