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
- When updating copy, honor Aleya’s luminous grove tone: poetic, gentle, and nature-infused while keeping guidance clear.
- Landing page role highlights currently center Journalers and Mentors; retire or add feature cards thoughtfully so the grid s
tays balanced across breakpoints.
- For modal overlays, center panels with `fixed inset-0 flex min-h-screen items-center justify-center` and wrap the panel
  content in a scrollable container (e.g. `max-h-[min(85vh,40rem)] overflow-y-auto`) so longer forms remain visible on smaller
  screens.
- Pair destructive or primary modal actions with a secondary "Cancel" control that uses `btn-secondary` so people always have
  a clear escape hatch.
- Keep modal headers in a single flex container that houses both the title block and the close button so the markup stays
  balanced and easier to maintain.
- Admins view a pared-down settings experience: hide mentor notification controls, the weekly summary toggle, profile submit
  actions, and the data export/deletion tools whenever `user.role === "admin"`.
- Admin mentor management lives on `/mentorship`: show mentor cards with linked mentees, allow linking by email, and surface a
  `Delete mentor` control using the shared button tokens so admins can curate relationships gracefully.
- In the Forms builder page, keep the admin view focused on stewardship: do not reintroduce the creation UI for admins, preserve
  the filter controls, and ensure the mentee association list stays actionable with the existing remove affordance.
