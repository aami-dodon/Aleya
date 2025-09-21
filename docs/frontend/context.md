# Contexts

## AuthContext
- **Location:** `frontend/src/context/AuthContext.js`
- **Provides:** `user`, `token`, `loading`, `error`, plus actions `login`, `register`, `logout`, `refreshProfile`, `updateProfile`, `deleteAccount`.
- **Persists:** Stores token + user in `localStorage` (`aleya.auth`) and restores on mount.
- **Used by:** `AppRoutes` for guards, `Layout` for navigation, `PanicButton`, `SettingsPage`, dashboards, and mentorship flows.
- **API touchpoints:** `/api/auth/login`, `/api/auth/register`, `/api/auth/me` (GET/PATCH/DELETE).
