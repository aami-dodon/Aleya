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

