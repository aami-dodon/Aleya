# Aleya

Aleya is a journaling and mentorship platform that pairs reflective journaling tools with mentor guidance. The repository hosts an Express + PostgreSQL API (`backend/`) and a React client (`frontend/`).

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

Create `backend/.env` with the following variables:

```
DATABASE_URL=postgres://<user>:<password>@<host>:<port>/<database>
DATABASE_SSL=false        # set to true only when your database requires SSL
PORT=5000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=super-secret-value

# Optional: seed a default administrator account on startup
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_NAME=Aleya Admin
```

- `DATABASE_URL` is required so the API can connect to PostgreSQL. The backend tests the connection on boot and will fail if it cannot reach the database.  
- `initializePlatform` automatically applies the SQL schema, ensures the default journaling form exists, and (optionally) seeds the admin user when the server starts.

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

## 7. Additional notes

- **Authentication** uses JSON Web Tokens. Set `JWT_SECRET` to a strong value in production.  
- **CORS**: update `CORS_ORIGIN` (comma-separated list) if you host the frontend on another domain.  
- **Notifications & defaults**: new users receive default notification preferences defined in `DEFAULT_NOTIFICATION_PREFS`. Adjust in `backend/utils/bootstrap.js` if you need different defaults.

With these steps Aleya should be fully operational for local development or evaluation.
