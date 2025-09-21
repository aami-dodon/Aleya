# Middleware

## authenticate
- **Location:** `backend/src/middleware/auth.js`
- **Behavior:** Parses bearer token, verifies JWT (`JWT_SECRET`), loads user record from PostgreSQL, and attaches `req.user`.
- **Failures:** Returns `401` for missing/invalid tokens.

## requireRole
- **Location:** `backend/src/middleware/requireRole.js`
- **Behavior:** Ensures `req.user.role` matches allowed roles, otherwise returns `403`.
- **Usage:** Applied across forms, mentorship, dashboard, and admin routes for fine-grained access control.
