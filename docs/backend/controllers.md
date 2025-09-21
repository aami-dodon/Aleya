# Controllers

Aleya routes co-locate controller logic with Express routers. Key handlers include:

## AuthController (`backend/src/routes/auth.js`)
- Validates registration/login payloads, hashes passwords, manages verification + password reset tokens, and hydrates mentor profiles.
- Provides profile CRUD for authenticated users and admin mentor profile listings.

## FormsController (`backend/src/routes/forms.js`)
- Normalises form JSON fields, enforces mentor ownership for creation/deletion, and hydrates assignments for journalers/admins.
- Handles mentor → journaler assignment lifecycle with transactional guards.

## JournalController (`backend/src/routes/journal.js`)
- Persists journal entries, enforces share-level access rules, surfaces CSV exports, and manages mentor comment threads.
- Triggers mentor notification service when entries are shared beyond `private`.

## DashboardController (`backend/src/routes/dashboard.js`)
- Aggregates streaks, mood averages, wellbeing trends, and highlight cards for journalers.
- Builds mentor overviews with alerts for low mood and crisis keywords.

## MentorsController (`backend/src/routes/mentors.js`)
- Powers mentor discovery, request lifecycle, mentor/journaler linking, panic alert dispatch, and support network listings.

## AdminController (`backend/src/routes/admin.js`)
- Provides platform analytics, form stewardship, mentor/journaler admin flows, and journal moderation utilities.
