# Aleya

Aleya is a journaling and mentorship platform that pairs reflective journaling tools with mentor guidance. The repository hosts an Express + PostgreSQL API (`backend/`) and a React client (`frontend/`).

## Product overview

### Vision & purpose

- **One-liner:** Aleya is a journaling and mentorship app that helps people reflect on their emotions, build habits, and grow with guidance.
- **Who is it for?** Individuals who want to journal for self-growth, mentors who want to support them, and administrators who manage the platform.
- **Why now?** Mental health challenges continue to rise because advice is often fragmented—focused solely on body, mind, work, or spirit. Aleya takes a holistic approach inspired by a tree: roots (self-care), trunk (purpose), branches (learning and relationships), and fruit (creative expression). Life feels whole only when every part is nurtured, so the product aims to guide users through integrated wellbeing.

### Users & roles

- **Journaler**
  - Goals: Build a journaling habit, track emotions and mood, and see progress over time.
  - Pain points: Consistency is difficult and accountability is limited without support.
- **Mentor**
  - Goals: Support mentees, spot red flags quickly, and encourage consistent reflection.
  - Needs: Simple dashboards, digestible entry summaries, and optional notifications.
- **Administrator**
  - Goals: Oversee the platform and keep user journeys running smoothly.
  - Responsibilities: Configure user journeys, manage journal forms, handle user data securely, monitor platform health, and onboard mentors.

### Core features (MVP)

- **Journal entry forms:** A collection of customizable forms rather than a single template. The default form captures mood (happy, loved, proud, relaxed, tired, anxious, angry, sad), the causes of today's emotions, and learnings. Optional fields include sleep, energy, and activities. Mentors can assign additional or specialised forms after both parties confirm the mentorship link.
- **Authentication:** Email + password with email verification.
- **Mentor linking:** Journalers can invite or select mentors, forming a mentorship connection only after mutual consent.
- **Reminders:** Daily or weekly reminders delivered via email.
- **Mentor notifications:** Email summaries of mentee entries with privacy controls to respect journaler choices.
- **Dashboards:** Role-specific dashboards showing streaks, average mood, trendlines, progress overviews, mentee highlights, and low-mood alerts.

### User flows

#### Journaler flow

1. **Sign up & onboarding** – Create an account, complete the profile, and begin journaling immediately with the default form.
2. **Explore & journal** – Fill in entries using the default form at any time.
3. **Optionally choose a mentor** – Search for or invite a mentor and send a request.
4. **Mentor acceptance** – Mentor accepts the request; the journaler confirms, completing the mutual-consent handshake.
5. **Form assignment** – Mentors can assign additional or custom forms once the link is confirmed.
6. **Complete forms & submit entries** – Journalers complete default and assigned forms and submit entries.
7. **Mentor notification flow** – Mentors are notified based on the journaler’s sharing preferences.
8. **Dashboard review** – Journalers view streaks, mood trends, and progress overviews.
9. **Account & settings management** – Journalers manage profiles, reset passwords, and may delete the account.

#### Mentor flow

1. **Sign up & onboarding** – Create a profile including expertise, availability, and preferences.
2. **Login & dashboard access** – View mentee lists, progress summaries, and alerts.
3. **Accept/decline requests** – Review incoming requests and accept to establish the mutual link.
4. **Assign forms** – After mutual consent, select or customise forms for each journaler.
5. **Track progress** – Monitor streaks, mood trends, and flagged entries.
6. **Engagement & feedback** – Provide encouragement, notes, or comments to mentees.
7. **Profile & reputation** – Maintain mentor profiles, respond to ratings, and manage account settings.

#### Administrator flow

1. **Sign up & onboarding** – Create an administrator account with elevated access.
2. **Login & dashboard access** – Manage system-level settings and monitor platform performance.
3. **Create & manage forms** – Build journal forms mentors can assign to journalers.
4. **Support mentors** – Onboard new mentors, review profiles, and provide resources.
5. **Moderation & escalation** – Handle disputes, flag or suspend abusive mentors, and resolve complaints.
6. **Platform oversight** – Ensure data security, manage user data, and monitor platform health.

### Privacy & controls

- **Data collection:** Journal entries, profile information, mentor–mentee links, and activity streaks.
- **User choices:** Journalers decide what mentors see—mood only, summaries, or full entries.
- **Confidentiality:** Default-form data stays private unless explicitly shared by the journaler.
- **Admin oversight:** Administrators manage forms and journeys but cannot view private journal content.
- **Security:** Data is stored securely using encryption and access control, with crisis keyword detection available for emergency escalation without exposing private details.
- **Lifecycle management:** Journalers and mentors can deactivate or delete accounts; data is archived or erased accordingly.
- **Notifications:** Supports email, push, or in-app notifications, following user preferences.

### Design principles

- **Holistic layout:** Tree-inspired metaphors—roots for self-care, trunk for growth, branches for learning and relationships, and fruit for creative expression.
- **Calm aesthetic:** Soft colour palette (muted blues/greens, warm neutrals), rounded edges, and minimal clutter.
- **Accessible & responsive:** Mobile-first design, smooth transitions, and readable typography.

## Project structure

```
.
├── backend/        # Express API, PostgreSQL migrations, bootstrap logic
├── frontend/       # React application served with Create React App tooling
├── docker-compose.yml
└── README.md
```

## Prerequisites

Before running Aleya locally make sure you have:

- **Node.js 18+** and **npm** (ships with Node). The Dockerfiles target Node 18.  
- **PostgreSQL 13+** (local installation, Docker container, or managed instance).  
- **Git** for cloning the repository.  
- *(Optional)* **Docker & Docker Compose** if you prefer containerised development.

## 1. Configure environment variables

Update `backend/.env` (a sample file is checked into the repo) with the following variables:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>
DATABASE_SSL=false        # set to true only when your database requires SSL
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=super-secret-value

# Logging configuration
LOG_FILE=logs/aleya.log
LOG_LEVEL=info
LOG_MAX_SIZE=5242880
LOG_MAX_FILES=5

# Optional: seed a default administrator account on startup
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_NAME=Aleya Admin

# SMTP configuration for email notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM="Aleya <no-reply@example.com>"
SMTP_SECURE=false
```

- `DATABASE_URL` is required so the API can connect to PostgreSQL. The backend tests the connection on boot and will fail if it cannot reach the database.
- `initializePlatform` automatically applies the SQL schema, ensures the default journaling form exists, and (optionally) seeds the admin user when the server starts.
- `LOG_FILE`, `LOG_LEVEL`, `LOG_MAX_SIZE`, and `LOG_MAX_FILES` configure structured logging. Paths supplied in `LOG_FILE` are resolved relative to `backend/` unless absolute; rotation kicks in once the file size limit is reached.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` configure the SMTP server used for notification emails. The backend validates these settings during start-up and will exit with a descriptive error if any value is missing or malformed.
- Set `SMTP_SECURE=true` when connecting to port 465 or any server that requires an implicit TLS connection. For ports that upgrade via STARTTLS (such as 587) leave it as `false`.

Create `frontend/.env` (the file must start with `REACT_APP_` variables for Create React App):

```
REACT_APP_API_URL=http://localhost:5000/api
```

## 2. Install dependencies

Install dependencies for each workspace:

```bash
# From the repository root
cd backend
npm install

cd ../frontend
npm install
```

## 3. Prepare the database

1. Create an empty PostgreSQL database, e.g. using `createdb aleya` or your GUI of choice.  
2. Ensure the credentials in `DATABASE_URL` can create tables. On startup the API will run the bootstrap routine that executes the schema, inserts the default "Daily Roots Check-In" form, and seeds an admin account when the `SEED_ADMIN_*` variables are provided.

No additional migration step is needed—the schema is managed automatically.

## 4. Run the application (local Node processes)

In one terminal start the backend (uses Nodemon in development):

```bash
cd backend
npm run dev
```

The API listens on `PORT` (default `5000`) and exposes a `/api/health` endpoint you can use to confirm connectivity.

In a second terminal start the React client:

```bash
cd frontend
npm start
```

By default the frontend runs on `http://localhost:3000` and proxies API calls to `REACT_APP_API_URL`.

## Logging

The backend emits structured JSON logs via [Winston](https://github.com/winstonjs/winston). Messages are written both to stdout and to the file configured by `LOG_FILE` (default `backend/logs/aleya.log`). To follow the log file during development:

```bash
tail -f backend/logs/aleya.log
```

If you customise `LOG_FILE` in `.env`, the logger will create the directory automatically. Log rotation is controlled by `LOG_MAX_SIZE` (bytes) and `LOG_MAX_FILES`.

## 5. Running with Docker (optional)

You can develop with Docker once your database is reachable from the containers (for a locally running Postgres instance on macOS/Windows use `host.docker.internal` in `DATABASE_URL`).

```bash
docker compose up --build
```

- The compose file starts the frontend and backend containers.  
- Provide environment variables (especially `DATABASE_URL` and `JWT_SECRET`) via `backend/.env` before running Compose—the file is mounted into the backend container.  
- PostgreSQL itself is **not** provisioned by `docker-compose.yml`; run it separately or extend the compose file with your own `postgres` service.

## 6. Useful scripts

| Location   | Command            | Purpose |
|------------|--------------------|---------|
| `backend`  | `npm run dev`       | Start API in watch mode using Nodemon. |
| `backend`  | `npm start`         | Start API without file watching (production style). |
| `frontend` | `npm start`         | Run the React development server with hot reload. |
| `frontend` | `npm run build`     | Build the production-ready static assets. |
| `frontend` | `npm test`          | Launch the Jest/React Testing Library runner. |

## 7. API reference

All endpoints are served from the `/api` prefix and return JSON. Supply an `Authorization: Bearer <token>` header for protected routes.

### Health check

- `GET /api/health` – Lightweight probe to confirm the server can connect to PostgreSQL.

### Authentication & profile

- `POST /api/auth/register` – Create a journaler or mentor account and trigger a verification email. *(Public)*
- `POST /api/auth/verify-email` – Confirm a pending account using the emailed token. *(Public)*
- `POST /api/auth/login` – Exchange credentials for a JWT and hydrated profile. *(Public)*
- `GET /api/auth/me` – Return the authenticated user profile, including mentor metadata when applicable. *(Authenticated)*
- `PATCH /api/auth/me` – Update name, timezone, notification preferences, password, and mentor profile fields. *(Authenticated)*
- `GET /api/auth/mentor/profiles` – List mentor profiles for administrative review. *(Admin only)*

### Form library

- `GET /api/forms/default` – Fetch the default "Daily Roots Check-In" journaling form. *(Public)*
- `GET /api/forms` – Return forms visible to the current user (defaults, assigned mentor forms, or the full catalogue for admins). *(Authenticated)*
- `POST /api/forms` – Create a reusable journaling form; mentors create `mentor`-visible templates, admins may publish `admin` forms. *(Mentor or admin)*
- `POST /api/forms/:formId/assign` – Assign a form to a journaler; mentors must already be linked to the journaler. *(Mentor or admin)*
- `DELETE /api/forms/:formId/assign/:journalerId` – Remove a form assignment from a journaler. *(Mentor or admin)*

### Journal entries

- `POST /api/journal-entries` – Submit a journal entry, automatically normalising mood, building a summary, and notifying linked mentors according to the share level. *(Journaler)*
- `GET /api/journal-entries` – Journalers retrieve their own history (with optional `limit`); mentors provide `journalerId` to view non-private entries for linked mentees. *(Authenticated)*
- `GET /api/journal-entries/:id` – Fetch a single entry; access is limited to the author or linked mentors when the entry is shared beyond `private`. *(Authenticated)*
- `GET /api/journal-entries/:id/comments` – List mentor comments attached to an entry. *(Authenticated)*
- `POST /api/journal-entries/:id/comments` – Add a mentor comment to a shared entry for a linked journaler. *(Mentor)*

### Mentorship workflows

- `GET /api/mentors` – Search mentors by name, email, or expertise using the `q` query parameter. *(Authenticated)*
- `GET /api/mentors/requests` – View mentorship requests relevant to the signed-in mentor or journaler. *(Authenticated)*
- `POST /api/mentors/requests` – Journalers request a mentor (prevents self-selection and duplicate links). *(Journaler)*
- `POST /api/mentors/requests/:id/accept` – Mentors acknowledge a pending request. *(Mentor)*
- `POST /api/mentors/requests/:id/confirm` – Journalers confirm an accepted request, establishing a mentor link. *(Journaler)*
- `POST /api/mentors/requests/:id/decline` – Decline a request as the involved mentor or journaler. *(Authenticated)*
- `GET /api/mentors/mentees` – Display linked journalers with their latest shared reflections. *(Mentor)*
- `GET /api/mentors/notifications` – Retrieve the 50 most recent entry notifications shared by mentees. *(Mentor)*
- `POST /api/mentors/notifications/:id/read` – Mark a notification as reviewed. *(Mentor)*

### Dashboards & analytics

- `GET /api/dashboard/journaler` – Aggregate streaks, average mood, highlights, and trend data for the journaler dashboard. *(Journaler)*
- `GET /api/dashboard/mentor` – Surface mentee trends, risk alerts, and activity indicators for mentors. *(Mentor)*

### Administration

- `GET /api/admin/overview` – Platform-level counts of users, forms, entries, mentor links, and pending requests. *(Admin)*
- `GET /api/admin/forms` – Review the full form library with assignment counts and creators. *(Admin)*
- `PATCH /api/admin/forms/:id` – Update form visibility, description, or default status. *(Admin)*
- `GET /api/admin/mentors` – List mentors with profile details and mentee counts. *(Admin)*

## 8. Troubleshooting

- **Database connection errors** – Confirm PostgreSQL is running, the credentials in `DATABASE_URL` are valid, and set `DATABASE_SSL=true` only when the server requires TLS. The backend will log "Database unreachable" if the health check fails.
- **Schema missing after first boot** – Ensure the database user has permissions to create tables. `initializePlatform` runs automatically on startup and seeds the default form and admin account when credentials are provided.
- **Requests blocked by CORS** – Update `CORS_ORIGIN` with the frontend origin (comma-separated for multiple hosts) so browsers can call the API successfully.
- **Unexpected 401/403 responses** – Verify the frontend is attaching the JWT in the `Authorization` header and that the account role matches the endpoint (e.g. admin routes require `admin`). Clearing the stored session in localStorage can resolve stale tokens.
- **Mentors cannot assign forms** – Mentors must first confirm a mentorship link with the journaler; otherwise the `/forms/:id/assign` route returns `403`.

## 9. Additional notes

- **Authentication** uses JSON Web Tokens. Set `JWT_SECRET` to a strong value in production.
- **CORS**: update `CORS_ORIGIN` (comma-separated list) if you host the frontend on another domain.
- **Notifications & defaults**: new users receive default notification preferences defined in `DEFAULT_NOTIFICATION_PREFS`. Adjust in `backend/utils/bootstrap.js` if you need different defaults.

With these steps Aleya should be fully operational for local development or evaluation.

## 10. Project wiki

See [docs/wiki.md](docs/wiki.md) for frontend specifications, backend internals, and architecture notes.
