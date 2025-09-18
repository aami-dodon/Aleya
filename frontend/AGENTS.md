# Frontend contributor notes

- Use the Tailwind utility wrappers defined in `src/index.css` (and re-exported via `src/styles/ui.js`) for all shared UI patterns.
- Buttons: `btn-primary`, `btn-secondary`, `btn-subtle`, `btn-danger`.
  - Form controls: `form-input`, `form-select`, `form-textarea`, `form-checkbox`, plus their compact variants.
- Typography tokens: `text-display`, `text-heading-*`, `text-body`, `text-body-sm`, `text-body-sm-strong`, `text-eyebrow`,
  `text-caption`, `form-label`.
- Retire unused Tailwind component classes when the corresponding design token falls out of use so the layer stays lean.
  - Helper styles: `card-container`, `empty-state`, `text-info`, `text-muted`, `chip-base`, `badge-base`.
- When composing new components, import the relevant constants from `src/styles/ui.js` instead of hard-coding class strings. This keeps the font stack and sizing consistent across the app.
- Update this document if you introduce new design tokens so future changes remain consistent.
- For modal overlays, center panels with `fixed inset-0 flex min-h-screen items-center justify-center` and wrap the panel
  content in a scrollable container (e.g. `max-h-[min(85vh,40rem)] overflow-y-auto`) so longer forms remain visible on smaller
  screens.
