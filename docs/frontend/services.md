# Services

## apiClient
- **Location:** `frontend/src/api/client.js`
- **Exports:** `get`, `post`, `patch`, `del`, `request`.
- **Behavior:** Prefixes requests with `process.env.REACT_APP_API_URL` (defaults to `http://localhost:5000/api`), attaches JSON headers, propagates bearer tokens, and normalises error payloads.
- **Consumers:** `AuthContext`, Forgot Password flow, dashboards, mentorship flows, forms builder, panic alerts.

## expertise utils
- **Location:** `frontend/src/utils/expertise.js`
- **Exports:** `parseExpertise`, `formatExpertise` helpers.
- **Behavior:** Deduplicates/sorts expertise tags, pairing with `useExpertiseSuggestions` to keep UI suggestions consistent.

## seo helpers
- **Location:** `frontend/src/utils/seo.js`
- **Purpose:** Generates social share metadata for landing marketing copy.

## timezone data
- **Location:** `frontend/src/utils/timezones.js`
- **Purpose:** Provides curated timezone list for settings + registration forms.
