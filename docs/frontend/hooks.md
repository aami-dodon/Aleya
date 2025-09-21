# Hooks

## useExpertiseSuggestions
- **Location:** `frontend/src/hooks/useExpertiseSuggestions.js`
- **Purpose:** Fetches mentor expertise keywords, normalises labels, and exposes `suggestions`, `loading`, `error`, `refresh`.
- **APIs:** `GET /api/auth/expertise?limit=` via `apiClient`.
- **Usage:** Mentor registration, Settings, and admin modals seed `TagInput` suggestions.

## useAuth (from context)
- **Location:** `frontend/src/context/AuthContext.js`
- **Purpose:** Provides `user`, `token`, `loading`, and auth methods (`login`, `register`, `logout`, `refreshProfile`, `updateProfile`, `deleteAccount`).
- **APIs:** Wraps `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/me` (PATCH/DELETE).
- **Usage:** Guards in `App.js`, `Layout`, `PanicButton`, settings flows, and dashboards.
