# Repository Wiki

## 2025-09-19
- Fixed the mentor panic alert route definition in `backend/routes/mentors.js` by restoring the missing closing `);` so Docker n
  odemon no longer crashes on startup.
- Updated `backend/AGENTS.md` to remind contributors to confirm route endings while running `node --check` on touched files.

## 2025-09-18
- Adjusted the mentor panic alert route to list each validator middleware individually instead of wrapping them in an array. This resolves a syntax parsing error observed when Docker booted the backend and keeps Express middleware handling straightforward.
- Confirmed the route still requires mentors to be authenticated before sending panic alerts, aligning with the README description of the feature.
- Added `backend/AGENTS.md` to capture backend-specific contributing notes and remind developers to update this wiki when changes are made.
