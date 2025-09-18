# Aleya Project Wiki

## 2025-02-15 - Stabilize API error handling
- Hardened the shared frontend API client so HTML proxy error pages (e.g., Cloudflare 502 responses) are converted into human readable status messages instead of being rendered directly in the UI.
- Documented expectation for feature work to surface `apiClient` error messages rather than raw response bodies.
