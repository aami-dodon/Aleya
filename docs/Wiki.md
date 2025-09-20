# 2025-10-15

- Added a root `backend/index.js` shim so Docker and nodemon resolve the backend entrypoint consistently now that the actual
  server lives in `src/index.js`, and documented the expectation in `backend/AGENTS.md` for future updates.

# 2025-10-14

- Reorganized the backend into `src/` and `tests/`, moved the SQL schema into `backend/docs/`, and added Jest + Prettier + ESLint tooling with CI coverage for format, lint, and unit tests.
- Added repository hygiene files (`.gitignore`, `LICENSE`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`) and refreshed the README with setup, quality gate, and documentation guidance.
- Created a backend utility test suite (`tests/utils/mood.test.js`) and documented the new workflow in `backend/AGENTS.md`.
- Reimagined the authenticated mobile header so the sticky bar keeps a slender profile while the navigation opens as a floating
  tray beneath it, keeping the main content visible. Captured the overlay guidance in `frontend/AGENTS.md` for future frontend
  updates.

# 2025-10-13

- Documented the frontend and backend package suites plus the platform's custom functionality highlights in `README.md` so new contributors can quickly see the tooling stack and advanced flows beyond static pages.

# 2025-10-12

- Retired the legacy mentor approval backend by deleting the unused routes plus the `mentor_approvals` table from the bootstrap helper and schema so registrations remain instant after verification.
- Added `docs/theme.html` as a standalone token showcase, updated the README and AGENT notes to reference it, and confirmed the frontend still leans on the shared Tailwind wrappers.

# 2025-10-11

- Retired the README reference to email reminders now that the cadence controls remain out of scope, and removed the dormant
  backlog entry from `docs/features.md` to keep the feature review aligned with the current product story.

# 2025-10-10

- Reintroduced share-aware mentor email notifications that trigger after journal entry creation by wiring `dispatchEntryNotifications`
  through the new `backend/services/mentorNotifications.js` helper.
- Added the mentor digest email job (`backend/jobs/sendMentorDigest.js`), refreshed the email templates to cover single-entry and
  digest layouts, and documented the feature and guardrails in `backend/AGENTS.md` and `docs/features.md`.

# 2025-10-09

- Documented the implemented and missing README features in `docs/features.md`, noting reminder and mentor notification gaps plus the broken panic alert flow.
- Added `docs/AGENTS.md` to guide future documentation updates within the knowledge base.


# 2025-10-08

- Let the mentor and journaler admin directories honor a shared `mentorId` focus filter, wiring the new select inputs through
  `useSearchParams` so deep links from Journals surface the intended guide and the `View journalers` shortcut lands on their
  linked mentees instantly.
- Updated mentor cards to pass both `mentorId` and human labels when jumping to Forms or Journalers, and taught the Forms admin
  table to hydrate from a new `creatorId` query parameter so creator filters stick even when a mentor lacks a display name.
- Noted the ID-based linking guidance in `frontend/AGENTS.md` to keep future dashboard navigation consistent across the admin
  stewardship pages.

# 2025-10-07

- Unified the admin stewardship pages by refactoring journaler and mentor directories into the shared table layout, wiring their
  filters through `useSearchParams`, and adding quick jumps into the new Journals index.
- Added `frontend/src/pages/JournalAdminPage.js` plus matching backend `/admin/journals` endpoints so admins can search, filter,
  and delete journal entries while tracing mentor ties directly from the dashboard.
- Extended the admin forms view to hydrate filters from the query string, letting cross-page "View forms" links land on the
  intended creator or visibility selection.

# 2025-10-06

- Reworked the admin form library table to drive its column layout through a shared `--table-grid` CSS variable so headers and
  rows stay aligned with the mentor directory pattern.
- Updated `frontend/src/index.css` to read the column template from the custom property and documented the override flow in
  `frontend/AGENTS.md` for future dashboard table tweaks.

# 2025-10-05

- Shifted the admin form catalogue on `FormBuilderPage` into the shared table layout so titles, visibilities, mentee chips, and
  delete controls align with the Mentor Directory styling across breakpoints.
- Captured the four-column table guidance in `frontend/AGENTS.md` to keep future tweaks anchored to the dashboard table pattern.

# 2025-10-04

- Refined the admin dashboard form library into responsive cards that surface friendly visibility and assignment labels, and documented the `table-header`/`table-row` token pattern in `frontend/AGENTS.md` so future tables keep the stacked mobile layout.

# 2025-10-03

- Introduced `backend/utils/emailTemplates.js` as the shared theme wrapper for transactional emails, ensuring subjects include the
  `[Aleya]` prefix, a consistent preheader, and the grove-inspired styling.
- Updated the registration verification email flow in `backend/routes/auth.js` to render through the new template so the
  verification button, copy, and fallback link all inherit the Aleya theme.

# 2025-10-02

- Dropped the `notification_preferences` column from `users`, removed the default constant in `backend/utils/bootstrap.js`, and pruned all backend references so the notification system is fully retired end-to-end.
- Updated the README to mark the notification system as retired and clarified that mentors now rely on dashboards plus transactional emails for updates.

# 2025-10-01

- Retired the in-app notification system entirely by deleting the bell UI, NotificationContext, and mentor notification cards so
  the frontend no longer references `/api/notifications`.
- Removed all backend notification routes, helpers, and database tables, simplifying mentor/admin flows to operate without
  dispatching `user_notifications` records or bell alerts.
- Trimmed Settings to profile essentials across every role by removing the reminder and notification preference controls.

# 2025-09-30

- Let mentor registrations follow the mentee workflow by removing the `mentor_approvals`
  gate in `backend/routes/auth.js`, allowing accounts to be created immediately and email
  verification links to be dispatched without waiting for admin review.
- Replaced the mentor application notifications with the new
  `mentor_registered_admin` and `mentor_registered_mentor` messages so admins still receive
  a heads-up while mentors get a welcome focused on verifying their email rather than
  awaiting approval.

# 2025-09-29

- Wrapped the authenticated shell with a new `GlobalErrorBoundary` component that renders a gentle fallback, offers retry and reload affordances, and records window errors plus unhandled promise rejections so runtime exceptions no longer splash raw traces across the UI.
- Added `frontend/AGENTS.md` guidance describing how to extend the boundary while keeping technical diagnostics tucked behind the existing disclosure toggle.

# 2025-09-28

- Ensured mentor registrations send acknowledgement emails by introducing the
  `mentor_application_submitted_mentor` notification so new mentors know their
  application is awaiting admin review while admins still receive their bell
  alert and email summary.
- Updated the registration flow to capture the inserted user's notification
  preferences and dispatch the mentor acknowledgement alongside the existing
  admin email so both sides stay informed during approval.

- Introduced a public `/api/auth/expertise` endpoint that aggregates mentor profile keywords, returning the most common tags in
  popularity order so registration flows can suggest existing expertise. The splitter mirrors `parseExpertise` to keep frontend
  and backend normalization aligned.
- Refined the shared `TagInput` component to surface matching suggestions and the top ten popular expertise tags beneath the
  field, preventing duplicates and preferring the canonical casing when mentors add items.
- Wired mentor registration and settings forms to fetch the expertise suggestions via the new hook so mentors can click to add
  existing areas of wisdom while still creating bespoke entries when needed.

- Let journalers open assigned forms inline on `JournalHistoryPage` by rendering `JournalEntryForm` when they press the "Bloom"
  button instead of redirecting through the dashboard. This keeps the CTA styling with `primaryButtonClasses` and allows
  reflections to begin without leaving the history view.
- Guided journalers to the inline Bloom form by auto-scrolling the newly revealed `SectionCard`, focusing its heading, and
  whispering a status message so the chosen prompts feel nearby. Documented the supporting `SectionCard` refs in `frontend/AGENTS.md`.
- Updated `frontend/AGENTS.md` to capture the inline Bloom guidance so future contributors preserve the on-page experience.
- Added a live password confirmation check on `RegisterPage` so the retype field highlights mismatches, shares a gentle reminder,
  and keeps the submit action disabled until both entries match. Noted the guidance in `frontend/AGENTS.md` for future frontend
  contributors.
- Fixed the `RegisterPage` password confirmation helper so `passwordsMismatch` is defined via state and synced on every edit,
  preventing runtime reference errors while keeping the inline reminder and disabled submit flow intact. Documented the helper in
  `frontend/AGENTS.md`.


- Added an admin-only Journaler navigation entry that links to the new `/journalers` route where the entire journaler management
  experience now lives. The mentorship view for admins focuses solely on mentor stewardship while the new page handles search,
  unlinking mentors, and deleting journaler accounts with the existing admin endpoints.

# 2025-09-27
- Gave each journaler form card on `JournalHistoryPage` a poetic CTA that links to `/dashboard?formId=...` so mentees can open a
  specific template directly, and taught `JournalerDashboard` to read and sync the `formId` query parameter while preserving the
  primary button styling documented in `frontend/AGENTS.md`.
- Shortened the journaler form CTA label to the single-word "Bloom" so the primary button keeps its theme styling without
  stretching taller than neighboring actions.
- Renamed the admin forms catalogue header to "Form Management" on `frontend/src/pages/FormBuilderPage.js` and added accessible
  labels plus journaler-focused search copy to the admin-only filters so screen readers describe each control clearly.
- Hid the journal reminder controls on the admin settings page so administrators no longer see the daily reflection or weekly
  summary toggles.

# 2025-09-26
- Extended the admin mentorship hub with a new Journaler management panel that lets admins search by name/email, review linked
  mentors, unlink relationships, and delete journaler accounts. Backed the UI with enriched `/admin/journalers` data and a new
  `DELETE /admin/journalers/:id` route so cascades clean up reflections, assignments, and links automatically.

# 2025-09-25
- Added admin mentor management endpoints: `/admin/mentor-links` to link journalers, `/admin/mentor-links/:mentorId/:journalerId`
  to sever connections, `/admin/journalers` for quick journaler lookups, and `/admin/mentors/:id` for removing mentor accounts
  while returning `/admin/mentors` with detailed mentee listings.
- Refreshed the admin mentorship page to focus on mentor stewardship by letting admins link mentees by email, review existing
  relationships, and delete mentors directly from the cards.

- Restricted `/forms` creation to mentors, enriched the admin `/forms` listing with creator names and mentee associations, and
  refreshed the Forms page so admins manage existing templates with filters, assignment removal, and delete controls instead of
  crafting new forms.

# 2025-09-24
- Added an admin-only DELETE `/admin/forms/:id` route that blocks removal of default templates while allowing admins to prune
  mentee-created forms and automatically clear their assignments.
- Noted in `backend/AGENTS.md` that default templates should remain protected when adjusting admin form management logic.

# 2025-09-21
- Added a secondary cancel action to the SOS modal in `frontend/src/components/PanicButton.js` using the shared `btn-secondary`
  token so people can close the dialog without reaching the header button.
- Adjusted the SOS overlay container spacing to keep the panel vertically centered instead of hugging the top edge of the
  viewport.

# Repository Wiki
## 2025-09-21
- Removed unused typography utility classes (`text-body-strong`, `text-body-muted`, `text-body-sm-muted`) from the Tailwind
  component layer and pruned their exports in `frontend/src/styles/ui.js` so the design tokens only track active usage.
- Refreshed `frontend/AGENTS.md` to list the remaining typography helpers and to note that obsolete Tailwind wrappers should be
  retired promptly.

## 2025-09-20
- Centered the SOS modal in `frontend/src/components/PanicButton.js` and constrained its height so it no longer renders off the
  top of the viewport on smaller screens.
- Documented the modal layout guidance in `frontend/AGENTS.md` to keep future overlays aligned and scrollable.

## 2025-09-19
- Fixed the mentor panic alert route definition in `backend/routes/mentors.js` by restoring the missing closing `);` so Docker n
  odemon no longer crashes on startup.
- Updated `backend/AGENTS.md` to remind contributors to confirm route endings while running `node --check` on touched files.

## 2025-09-18
- Adjusted the mentor panic alert route to list each validator middleware individually instead of wrapping them in an array. This resolves a syntax parsing error observed when Docker booted the backend and keeps Express middleware handling straightforward.
- Confirmed the route still requires mentors to be authenticated before sending panic alerts, aligning with the README description of the feature.
- Added `backend/AGENTS.md` to capture backend-specific contributing notes and remind developers to update this wiki when changes are made.
# 2025-09-22
- Rewrote major frontend copy (landing, authentication, dashboards, notifications, SOS modal) with Aleya’s poetic grove tone so the experience feels consistently luminous and nature-infused.
- Updated `frontend/AGENTS.md` to note the new copy voice guidance for future contributors.

# 2025-09-23
- Removed the landing page administrator feature card and tightened the feature grid to two columns so only journalers and mentors are highlighted.
- Extended `frontend/AGENTS.md` with a note about keeping the landing feature cards balanced across breakpoints.
- Restored the SOS modal header structure in `frontend/src/components/PanicButton.js` so the close button sits inside the header flex row, preventing mismatched JSX tags, refreshed `frontend/src/styles/ui.js` with a `bodySmallMutedTextClasses` alias for the muted small text token, and updated `frontend/AGENTS.md` with the guidance to keep header content wrapped together.

# 2025-09-24
- Hid mentor notification controls, the weekly summary toggle, the save action, and the data export/delete options when `user.role === "admin"` inside `frontend/src/pages/SettingsPage.js` so administrators see only relevant settings.
- Documented the pared-back admin settings experience in `frontend/AGENTS.md`.

