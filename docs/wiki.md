# Aleya Project Wiki

## Architecture overview

- **Monorepo layout** – `backend/` hosts the Express API, `frontend/` contains the React client, and `docker-compose.yml` wires both services for local development convenience.
- **Server entry point** – `backend/index.js` configures CORS, JSON parsing, and mounts route modules under the `/api` prefix before bootstrapping the database and starting the HTTP server.
- **Database connectivity** – `backend/db.js` uses `pg`'s pooled client with SSL opt-in via `DATABASE_SSL`, logging an initial connectivity check when the app boots.
- **Bootstrap lifecycle** – `initializePlatform` in `backend/utils/bootstrap.js` ensures schema creation, seeds the default "Daily Roots Check-In" form, and optionally provisions an administrator based on environment variables.
- **Shared environment** – both apps load `.env` files; the frontend consumes `REACT_APP_API_URL` while the backend expects `DATABASE_URL`, `CORS_ORIGIN`, `JWT_SECRET`, and optional seeding credentials.
- **Deployment considerations** – the Express API exposes HTTP on `PORT` (default `5000`) and the React app on `3000`; Docker images leverage Node 18+ and can be orchestrated via the provided compose file.

## Frontend specifications

### Tech stack & structure

- **Libraries** – React 19 with `react-router-dom` 6 for routing, `date-fns` for formatting, and Testing Library packages for unit tests.
- **Directory roles** – `src/api` contains a thin `fetch` wrapper, `src/context` offers shared auth state, `src/components` houses reusable UI building blocks, and `src/pages` implements route-level screens.
- **Routing shell** – `App.js` wires `AuthProvider` around `BrowserRouter`, protecting routes by role and rendering dashboards based on the authenticated user's role.
- **Layout** – `components/Layout.js` renders navigation links tailored to the active role and exposes authentication actions in the header.
- **Authentication state** – `context/AuthContext.js` persists JWTs and user profiles to `localStorage`, provides login/register helpers, and exposes profile mutation utilities.

### Key user journeys

- **Journalers** – `pages/JournalerDashboard.js` fetches available forms, metrics, and entry history; `JournalEntryForm` dynamically renders fields, validates required prompts, controls share levels, and submits entries to `/journal-entries`.
- **Mentors** – `pages/MentorDashboard.js` aggregates mentee mood trends, low-mood/crisis alerts, pending requests, and entry notifications while allowing accept/confirm/decline actions.
- **Admins** – `pages/AdminDashboard.js` displays platform metrics, the form catalogue, and mentor directory using aggregated admin endpoints.
- **Navigation** – additional pages (e.g. `MentorConnectionsPage`, `JournalHistoryPage`, `SettingsPage`) use the shared API client for CRUD flows around mentorship links, journaling history, and profile updates.

## Backend specifications

### Tech stack & modules

- **Framework** – Express 5 with middleware for CORS, JSON parsing, authentication (`middleware/auth.js`), and role checks (`middleware/requireRole.js`).
- **Data access** – PostgreSQL via `pg` using pooled queries; helpers in `utils/metrics.js` and `utils/mood.js` compute streaks, trends, and mood messaging for dashboards.
- **Routing** – modular route files (auth, forms, mentors, journal, dashboard, admin) mounted in `index.js`, each employing `express-validator` for payload validation and consistent error handling.

### Data model

- **Core tables** – `users`, `mentor_profiles`, `mentor_requests`, `mentor_links`, `journal_forms`, `journal_form_fields`, `mentor_form_assignments`, `journal_entries`, `mentor_notifications`, and `entry_comments` are created automatically during bootstrap.
- **Defaults** – the bootstrap routine seeds notification preferences and the "Daily Roots Check-In" form (with mood, reflection, and wellbeing fields) and can create a default admin when `SEED_ADMIN_*` variables are set.
- **Indexes** – targeted indexes on journal entries, mentor notifications, and form assignments support frequent lookups in dashboards and mentorship flows.

### API responsibilities

- **Authentication** – registration hashes passwords, supports optional mentor profiles, returns JWTs, and exposes profile update endpoints.
- **Form management** – mentors and admins can create and assign forms, while journalers retrieve the default and assigned prompts; assignments enforce confirmed mentorship links.
- **Journaling** – journalers submit entries with share levels; mentors view mentee entries according to visibility, leave comments, and receive notifications.
- **Mentorship** – search mentors, manage request lifecycle (request, accept, confirm, decline), maintain mentor/journaler links, and surface mentee summaries.
- **Dashboards** – provide role-specific analytics by combining journal data with mood scoring and crisis keyword detection.
- **Administration** – expose overview metrics, form catalogue management, and mentor directory endpoints restricted to admins.

