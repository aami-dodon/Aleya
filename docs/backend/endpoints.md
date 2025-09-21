# API Endpoints

## Auth
### POST /api/auth/register
- **Request:** `{ email, password, confirmPassword, name, role?, timezone?, mentorProfile? }`
- **Response:** `201` with `{ message, email, verificationExpiresAt, verificationExpiresInHours }`.
- **Notes:** Creates journaler by default; mentors optionally seed expertise/availability/bio and receive verification email.

### POST /api/auth/login
- **Request:** `{ email, password }`
- **Response:** `200` with `{ token, user }` once verified. If unverified, resends verification token and returns `403`.

### POST /api/auth/forgot-password
- **Request:** `{ email }`
- **Response:** `200` with success copy even when the account is missing; stores a hashed reset token with a rolling expiry and emails the Aleya-branded reset link when the user exists.
- **Notes:** Token lifetime defaults to 2 hours but honours `PASSWORD_RESET_TTL_HOURS`; reset links use `PASSWORD_RESET_URL` or the configured app base URL fallbacks.

### POST /api/auth/verify-email
- **Request:** `{ token }`
- **Response:** `200` with success message; clears verification hash on success.

### GET /api/auth/me
- **Auth:** Bearer token
- **Response:** `{ user }` including mentor profile when applicable.

### PATCH /api/auth/me
- **Auth:** Bearer token
- **Request:** Partial `{ name?, timezone?, password?, mentorProfile? }`
- **Response:** Updated `{ user }`.

### DELETE /api/auth/me
- **Auth:** Bearer token
- **Request:** `{ password }`
- **Response:** `{ message: "Account deleted" }` after cascading cleanup.

### GET /api/auth/mentor/profiles
- **Auth:** Admin
- **Response:** `{ mentors: [...] }` list with expertise/bio fields.

### GET /api/auth/expertise
- **Query:** `q`, `limit`
- **Response:** `{ expertise: [{ label, value, frequency }] }` deduplicated from mentor profiles.

## Forms
### GET /api/forms/default
- **Auth:** Public
- **Response:** `{ form }` default journaling template.

### GET /api/forms
- **Auth:** Bearer token
- **Behavior:**
  - Journaler: returns assigned + default forms with `assignment` metadata.
  - Mentor: returns mentor-authored + admin-visible forms.
  - Admin: returns all forms enriched with mentee assignments.

### POST /api/forms
- **Auth:** Mentor
- **Request:** `{ title, description?, fields: [{ label, fieldType, required?, options?, helperText? }], visibility? }`
- **Response:** `201` with `{ form }` newly created (visibility defaults to `mentor`).

### PUT /api/forms/:id
- **Auth:** Mentor (owner)
- **Request:** `{ title, description?, fields: [{ label, fieldType, required?, options?, helperText? }] }`
- **Response:** `{ form }` with refreshed prompts once ownership is confirmed; default templates remain locked.

### DELETE /api/forms/:id
- **Auth:** Mentor (owner)
- **Response:** `{ success: true }` once the mentor-owned, non-default form is removed.

### POST /api/forms/:formId/assign
- **Auth:** Mentor (owner)
- **Request:** `{ journalerId }`
- **Response:** `{ assignment }` linking form to journaler when they share a confirmed mentor link.

### DELETE /api/forms/:formId/assign/:journalerId
- **Auth:** Mentor (owner)
- **Response:** `{ success: true }` removing a specific mentee assignment.

### DELETE /api/forms/:formId/assignment
- **Auth:** Journaler (self)
- **Response:** `{ success: true }` when a journaler unlinks a non-default form from their dashboard.

## Journal Entries
### POST /api/journal-entries
- **Auth:** Journaler
- **Request:** `{ formId, entryDate?, mood?, sharedLevel, summary?, responses: [...] }`
- **Response:** `201` with `{ entry }` and triggers mentor notifications based on share level.

### PATCH /api/journal-entries/:id
- **Auth:** Journaler (owner)
- **Request:** Partial update for mood, summary, sharedLevel, responses.
- **Response:** Updated `{ entry }`.

### DELETE /api/journal-entries/:id
- **Auth:** Journaler (owner)
- **Response:** `{ success: true }` and cascades comments.

### GET /api/journal-entries
- **Auth:** Bearer token
- **Query:** `limit`, `offset`, `mood`, `mentorId`, `sharedLevel`, `formId`, `q`
- **Behavior:**
  - Journaler: returns own entries with filters.
  - Mentor: returns linked journalers' non-private entries.
  - Admin: redirected to `/api/admin/journals`.

### GET /api/journal-entries/export
- **Auth:** Journaler or Mentor
- **Response:** CSV payload of accessible entries (mentor receives shared entries only).

### GET /api/journal-entries/:id
- **Auth:** Journaler (owner), Mentor (linked + non-private), or Admin
- **Response:** Detailed entry with form + responses.

### GET /api/journal-entries/:id/comments
- **Auth:** Mentor or Journaler
- **Response:** `{ comments: [...] }` (mentors see own comments, journalers see mentor notes).

### POST /api/journal-entries/:id/comments
- **Auth:** Mentor linked to journaler and entry shared beyond `private`
- **Request:** `{ comment }`
- **Response:** `{ comment }` newly created.

## Dashboard
### GET /api/dashboard/journaler
- **Auth:** Journaler
- **Response:** `{ streak, averageMood, moodDescriptor, trend, sleepTrend, energyTrend, highlights, lastEntry, stats }`.

### GET /api/dashboard/mentor
- **Auth:** Mentor
- **Response:** `{ overview, mentees: [{ id, name, averageMood, trend, recentEntries, alerts }] }`.

## Mentors
### GET /api/mentors
- **Auth:** Journaler or Admin
- **Query:** `q`, `limit`
- **Response:** `{ mentors: [...] }` with expertise and availability.

### GET /api/mentors/requests
- **Auth:** Journaler or Mentor
- **Response:** `{ requests: [...] }` including both sides of the invitation.

### POST /api/mentors/requests
- **Auth:** Journaler
- **Request:** `{ mentorId, message? }`
- **Response:** `{ success: true }` creating or resetting a pending request.

### POST /api/mentors/requests/:id/accept
- **Auth:** Mentor
- **Response:** `{ success: true }` sets status to `mentor_accepted`.

### POST /api/mentors/requests/:id/confirm
- **Auth:** Journaler
- **Response:** `{ success: true }` creates mentor link transactionally.

### POST /api/mentors/requests/:id/decline
- **Auth:** Mentor or Journaler (role-specific) to decline invitations.

### DELETE /api/mentors/links/:mentorId
- **Auth:** Journaler
- **Request:** `{ password }`
- **Response:** `{ success: true }` removes link, mentor assignments, and ends confirmed requests.

### GET /api/mentors/mentees
- **Auth:** Mentor
- **Response:** `{ mentees: [...] }` including recent share levels.

### GET /api/mentors/support-network
- **Auth:** Journaler
- **Response:** `{ mentors: [...] }` (verified mentors linked to journaler) for PanicButton dialog.

### POST /api/mentors/panic-alerts
- **Auth:** Journaler
- **Request:** `{ mentorId, message }`
- **Response:** `{ success: true }` after emailing selected mentor.

## Admin
### GET /api/admin/overview
- **Auth:** Admin
- **Response:** Aggregated counts for users, forms, journal entries, mentor links, pending requests.

### GET /api/admin/forms
- **Auth:** Admin
- **Response:** `{ forms: [...] }` with assignment counts.

### PATCH /api/admin/forms/:id
- **Auth:** Admin
- **Request:** `{ description?, visibility?, isDefault? }`
- **Response:** `{ form }` updated metadata (cannot toggle default deletions).

### DELETE /api/admin/forms/:id
- **Auth:** Admin
- **Response:** `{ success: true }` when deleting non-default forms.

### GET /api/admin/mentors
- **Auth:** Admin
- **Response:** `{ mentors: [...] }` with mentee aggregates.

### DELETE /api/admin/mentors/:id
- **Auth:** Admin
- **Response:** `{ success: true }` after removing mentor account and cascading links.

### GET /api/admin/journalers
- **Auth:** Admin
- **Query:** `q`, `limit`
- **Response:** `{ journalers: [...] }` with mentor relationship arrays.

### POST /api/admin/mentor-links
- **Auth:** Admin
- **Request:** `{ mentorId, journalerId? , journalerEmail? }`
- **Response:** `{ success: true, link: { mentorId, journalerId } }` ensuring relationship exists and requests mark confirmed.

### DELETE /api/admin/mentor-links/:mentorId/:journalerId
- **Auth:** Admin
- **Response:** `{ success: true }` removing the link and marking historical requests as ended.

### DELETE /api/admin/journalers/:id
- **Auth:** Admin
- **Response:** `{ success: true }` removing journaler account with cascading cleanup.

### GET /api/admin/journals
- **Auth:** Admin
- **Query:** `q`, `sharedLevel`, `mood`, `journalerId`, `mentorId`, `formId`, `limit`
- **Response:** `{ entries: [...] }` including share level, mood, mentor aggregates.

### DELETE /api/admin/journals/:id
- **Auth:** Admin
- **Response:** `{ success: true }` deleting entry and associated comments.
