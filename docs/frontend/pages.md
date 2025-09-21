# Pages

## LandingPage
- **Route:** `/`
- **Components:** Hero cards with inline `FeatureCard` + `TreeLayer` helpers; relies on `Layout` wrapper for navigation.
- **APIs:** None – marketing copy only.

## LoginPage
- **Route:** `/login`
- **Components:** Styled form using Tailwind tokens; navigation copy plus CTA grid.
- **APIs:** `authContext.login()` → `POST /api/auth/login`.

## ForgotPasswordPage
- **Route:** `/forgot-password`
- **Components:** Single-field request form with Aleya copy, status banners, and CTA redirect back to login.
- **APIs:** `apiClient.post("/auth/forgot-password")` submits the email directly without AuthContext involvement.

## RegisterPage
- **Route:** `/register`
- **Components:** Multi-step role selector, mentor expertise fields with `TagInput`, timezone select.
- **APIs:** `authContext.register()` → `POST /api/auth/register`; mentor expertise suggestions via `useExpertiseSuggestions` → `GET /api/auth/expertise`.

## VerifyEmailPage
- **Route:** `/verify-email`
- **Components:** Status cards reflecting verification results; uses query token from URL.
- **APIs:** `POST /api/auth/verify-email` to activate accounts; surfaces `authContext.register()` guidance when token expires.

## DashboardRouter / JournalerDashboard
- **Route:** `/dashboard` (journaler role)
- **Components:** `JournalEntryForm`, `MetricCard`, `MoodTrendChart`, `SectionCard` wrappers, timeline cards.
- **APIs:**
  - `GET /api/forms` to load assigned + default forms.
  - `GET /api/dashboard/journaler` for streak + trend metrics.
  - `GET /api/journal-entries?limit=20` for recent entries.
  - `POST /api/journal-entries` when saving a new entry.

## DashboardRouter / MentorDashboard
- **Route:** `/dashboard` (mentor role)
- **Components:** `SectionCard`, mentee list table, trend charts, alert chips, `MentorRequestList`.
- **APIs:** `GET /api/dashboard/mentor` for mentee metrics; `GET /api/mentors/requests` for pending invitations and status updates.

## DashboardRouter / AdminDashboard
- **Route:** `/dashboard` (admin role)
- **Components:** Aggregated stats cards, recent forms/journals tables using `table-header`/`table-row` tokens.
- **APIs:** `GET /api/admin/overview` for counts; `GET /api/admin/forms` for steward cards; `GET /api/admin/journals` for recent shares.

## JournalHistoryPage
- **Route:** `/journal/history`
- **Components:** Filter bar (`selectCompactClasses`), entry list with share/mood chips, export buttons.
- **APIs:**
  - `GET /api/journal-entries` with query params (`mood`, `mentorId`, `shareLevel`, `q`).
  - `GET /api/journal-entries/export` for CSV download.
  - `PATCH /api/journal-entries/:id` + `DELETE /api/journal-entries/:id` for editing/removing journaler entries.
  - `GET /api/journal-entries/:id/comments` and `POST /api/journal-entries/:id/comments` for mentor feedback when allowed.

## MentorConnectionsPage
- **Route:** `/mentorship`
- **Components:** `SectionCard`, `MentorRequestList`, admin grids, optional `MentorProfileDialog` for linking, panic contact list.
- **APIs:**
  - Journaler: `GET /api/mentors`, `POST /api/mentors/requests`, `POST /api/mentors/requests/:id/confirm`, `DELETE /api/mentors/links/:mentorId`.
  - Mentor: `GET /api/mentors/requests`, `POST /api/mentors/requests/:id/accept`, `POST /api/mentors/requests/:id/decline`, `GET /api/mentors/mentees`.
  - Admin: `GET /api/admin/mentors`, `GET /api/admin/journalers`, `POST /api/admin/mentor-links`, `DELETE /api/admin/mentor-links/:mentorId/:journalerId`, `DELETE /api/admin/mentors/:id`.
  - Panic flows: `GET /api/mentors/support-network`, `POST /api/mentors/panic-alerts` (triggered through `PanicButton`).

## JournalerManagementPage
- **Route:** `/journalers` (admin only)
- **Components:** Responsive table with filter controls, mentor chip stacks, inline actions.
- **APIs:** `GET /api/admin/journalers` with `q`, `link`, `mentorId` filters; `DELETE /api/admin/mentor-links/:mentorId/:journalerId` to unlink mentors; `DELETE /api/admin/journalers/:id` to retire accounts.

## JournalAdminPage
- **Route:** `/journals` (admin only)
- **Components:** Table of journal entries, share level chips, filter form.
- **APIs:** `GET /api/admin/journals` for search/filter; `DELETE /api/admin/journals/:id` to remove entries with cascading cleanup.

## FormBuilderPage
- **Route:** `/forms`
- **Components:** Mentor form composer for creation; admin stewardship table of all forms and mentee assignments.
- **APIs:**
  - Mentor: `GET /api/forms`, `POST /api/forms` to create new prompts, `PUT /api/forms/:id` to refresh existing templates, `DELETE /api/forms/:id` to archive mentor-authored templates, `POST /api/forms/:formId/assign` to map mentees, `DELETE /api/forms/:formId/assign/:journalerId` to unlink mentees.
  - Admin: `GET /api/admin/forms`, `PATCH /api/admin/forms/:id` to update visibility/flags, `DELETE /api/admin/forms/:id` to remove non-default forms.

## SettingsPage
- **Route:** `/settings`
- **Components:** Profile edit form with timezone select, mentor expertise controls, password update, account deletion modal.
- **APIs:**
  - `GET /api/auth/me` (via `refreshProfile`) for latest profile data.
  - `PATCH /api/auth/me` for name/timezone/password + mentor profile updates.
  - `DELETE /api/auth/me` to close account (requires password confirmation).

## Verify + Support Utilities
- **Route:** Inline modals and toasts surfaced across pages.
- **Components:** `PanicButton`, success banners, toasts reused across dashboards.
- **APIs:** Shared `apiClient` handles auth headers for every request, reading `AuthContext.token`.
