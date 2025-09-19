# Contributing to Aleya

Thank you for your interest in tending Aleya's grove. This guide explains how to set up
your environment, propose changes, and honour the repo's conventions.

## Development workflow

1. **Clone and install**
   - Backend
     ```bash
     cd backend
     npm install
     ```
   - Frontend
     ```bash
     cd frontend
     npm install
     ```
2. **Create a feature branch** off the latest `main` (or the active integration branch).
3. **Follow the structure**
   - Backend code lives in `backend/src/` with tests in `backend/tests/`.
   - Documentation belongs under `docs/` or the relevant package `docs/` folder.
4. **Run quality checks** before opening a pull request:
   ```bash
   cd backend
   npm run format:check
   npm run lint
   npm test
   ```
   The frontend continues to use the React Testing Library suite via `npm test`.
5. **Update knowledge bases**
   - Summarise noteworthy backend/frontend changes in `docs/Wiki.md`.
   - Refresh the relevant `AGENTS.md` file(s) whenever new conventions are introduced.
6. **Submit a pull request** describing the change, tests performed, and any follow-up
   work. Please keep the tone warm and poetic to match Aleya's documentation style.

## Commit style

- Write clear, descriptive commit messages that explain the intent.
- Group related changes together; avoid mixing refactors with feature work when possible.

## Coding guidelines

- Backend JavaScript is linted with ESLint (recommended + Prettier). Use `npm run format`
  to apply formatting automatically.
- Prefer small, pure functions and add unit tests for new helpers or utilities.
- Document complex logic inline with comments or docstrings for future mentors.

## Reporting issues

Use GitHub issues to report bugs or request features. Please include:

- Expected vs. actual behaviour
- Steps to reproduce, including sample data if helpful
- Environment details (OS, Node version, browser)

We look forward to nurturing Aleya together. 🌿
