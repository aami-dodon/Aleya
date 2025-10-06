# Backend API Reference

All routes are served under the `/api` prefix. The tables below summarise the available endpoints, required authentication, and core behaviours inferred from the implementation.

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | Public | Performs a database connectivity check and returns the API boot identifier timestamp. |

## Authentication & Accounts

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/auth/session` | Public | Returns the current API boot identifier so clients can detect restarts. |
| POST | `/auth/register` | Public | Creates a journaler (default) or mentor account, seeds mentor profile data when supplied, and emails a verification link. |
| POST | `/auth/login` | Public | Exchanges verified email/password credentials for a JWT; unverified accounts receive a refreshed verification email. |
| POST | `/auth/forgot-password` | Public | Stores a hashed password-reset token (rolling expiry) and, when the email exists, sends an Aleya-branded reset email. |
| POST | `/auth/reset-password` | Public | Validates a reset token, updates the password hash, and clears the stored token on success. |
| POST | `/auth/verify-email` | Public | Confirms an email verification token, marking the user as verified and clearing token metadata. |
| GET | `/auth/me` | Bearer token | Returns the authenticated user profile, including mentor profile data when applicable. |
| PATCH | `/auth/me` | Bearer token | Allows the authenticated user to update name, timezone, password, and mentor profile metadata. |
| DELETE | `/auth/me` | Bearer token | Deletes the authenticated account after confirming the current password. |
| GET | `/auth/mentor/profiles` | Admin | Lists mentor accounts with their profile metadata for admin review. |
| GET | `/auth/expertise` | Public | Aggregates mentor expertise tags (optionally filtered by `q`) for autocomplete suggestions. |
| GET | `/auth/google` | Public | Initiates the Google OAuth flow (redirects to Google for consent). |
| GET | `/auth/google/callback` | Public | Handles the Google OAuth callback, issuing a JWT and redirecting to the frontend. |
| GET | `/auth/social-accounts` | Bearer token | Returns the authenticated user's linked social login providers. |
| DELETE | `/auth/social-accounts/:provider` | Bearer token | Unlinks a social login provider when the user still has another authentication method. |

## Forms

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/forms/default` | Public | Fetches the default journaling form definition. |
| GET | `/forms` | Bearer token | Returns forms relevant to the caller (assigned forms for journalers, owned/shared for mentors, full catalogue for admins). |
| POST | `/forms` | Mentor | Creates a mentor-authored form with the provided fields. |
| PUT | `/forms/:formId` | Mentor | Updates a mentor-owned form's metadata and fields. |
| POST | `/forms/:formId/assign` | Mentor/Admin | Assigns a form to a journaler (mentors must own the form and have an active mentorship link). |
| DELETE | `/forms/:formId/assign/:journalerId` | Mentor/Admin | Removes a form assignment for a specific journaler. |
| DELETE | `/forms/:formId` | Mentor | Deletes a mentor-owned, non-default form. |
| DELETE | `/forms/:formId/assignment` | Journaler | Lets a journaler unlink a non-default form that was assigned to them. |

## Journal Entries

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/journal-entries` | Journaler | Creates a journal entry for an assigned form, summarising responses and dispatching mentor notifications. |
| PATCH | `/journal-entries/:id` | Journaler | Updates an existing journal entry's responses and sharing level when owned by the caller. |
| DELETE | `/journal-entries/:id` | Journaler | Removes a journal entry owned by the caller. |
| GET | `/journal-entries` | Bearer token | Lists entries for the caller (journalers see their own; mentors see non-private entries for a specified mentee link). |
| GET | `/journal-entries/export` | Bearer token | Exports journal entries to a JSON download (journalers get their own; mentors need a linked journaler). |
| GET | `/journal-entries/:id` | Bearer token | Retrieves a single entry if the caller is the journaler or a linked mentor with sufficient sharing level. |
| GET | `/journal-entries/:id/comments` | Bearer token | Lists mentor comments on an entry when the caller can access the entry. |
| POST | `/journal-entries/:id/comments` | Mentor | Adds a mentor comment to a non-private entry for a linked journaler. |

## Mentors & Links

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/mentors` | Bearer token | Searches mentors by name, email, or expertise for authenticated users. |
| GET | `/mentors/requests` | Bearer token | Lists mentorship requests relevant to the caller (mentor or journaler). |
| POST | `/mentors/requests` | Journaler | Creates or refreshes a mentorship request to a mentor. |
| POST | `/mentors/requests/:id/accept` | Mentor | Marks a pending mentorship request as accepted by the mentor. |
| POST | `/mentors/requests/:id/confirm` | Journaler | Confirms an accepted mentorship request and creates the mentor link. |
| POST | `/mentors/requests/:id/decline` | Mentor/Journaler | Declines a mentorship request when initiated by either party. |
| DELETE | `/mentors/links/:mentorId` | Journaler | Removes a mentor link after password confirmation and cleans up related assignments. |
| GET | `/mentors/mentees` | Mentor | Lists the mentor's linked journalers with the latest entry summary. |
| GET | `/mentors/support-network` | Mentor | Lists mentors linked to the authenticated mentor (support network). |
| POST | `/mentors/panic-alerts` | Mentor | Raises a mentor panic alert to another linked mentor (placeholder response in current implementation). |

## Dashboard

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/dashboard/journaler` | Journaler | Provides journaling metrics, trends, and highlights for the journaler. |
| GET | `/dashboard/mentor` | Mentor | Aggregates mentee information, including recent shared entries and mood insights. |

## Admin

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/admin/overview` | Admin | Returns platform-level counts for users, forms, journal entries, mentor links, and pending requests. |
| GET | `/admin/forms` | Admin | Lists forms with creator metadata and assignment counts. |
| PATCH | `/admin/forms/:id` | Admin | Updates form description, visibility, or default status. |
| DELETE | `/admin/forms/:id` | Admin | Deletes a non-default form. |
| GET | `/admin/mentors` | Admin | Lists mentors with profile information and linked journalers. |
| GET | `/admin/journalers` | Admin | Lists journalers with linked mentors, supporting optional search and pagination. |
| POST | `/admin/mentor-links` | Admin | Creates a mentor link between an existing mentor and journaler. |
| DELETE | `/admin/mentor-links/:mentorId/:journalerId` | Admin | Removes a mentor link and updates associated mentor requests. |
| GET | `/admin/journals` | Admin | Searches journal entries with filters for sharing level, mood, mentor, journaler, and form. |
| DELETE | `/admin/journals/:id` | Admin | Deletes a journal entry. |
| DELETE | `/admin/journalers/:id` | Admin | Permanently deletes a journaler account (with cascading data removal). |

