# Frontend contributor notes

- Use the Tailwind utility wrappers defined in `src/index.css` (and re-exported via `src/styles/ui.js`) for all shared UI patterns.
- Buttons: `btn-primary`, `btn-secondary`, `btn-subtle`, `btn-danger`.
  - Form controls: `form-input`, `form-select`, `form-textarea`, `form-checkbox`, plus their compact variants.
  - Typography tokens: `text-display`, `text-heading-*`, `text-body*`, `text-eyebrow`, `text-caption`, `form-label`.
  - Helper styles: `card-container`, `empty-state`, `text-info`, `text-muted`, `chip-base`, `badge-base`.
- When composing new components, import the relevant constants from `src/styles/ui.js` instead of hard-coding class strings. This keeps the font stack and sizing consistent across the app.
- Update this document if you introduce new design tokens so future changes remain consistent.
- The shared API client normalizes error responses and strips HTML payloads from upstream proxies. When handling errors, rely on
  the `message` field returned by `apiClient` instead of rendering raw response bodies.
