
# 2025-09-28
- Let journalers open assigned forms inline on `JournalHistoryPage` by rendering `JournalEntryForm` when they press the "Bloom"
  button instead of redirecting through the dashboard. This keeps the CTA styling with `primaryButtonClasses` and allows
  reflections to begin without leaving the history view.
- Updated `frontend/AGENTS.md` to capture the inline Bloom guidance so future contributors preserve the on-page experience.

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

