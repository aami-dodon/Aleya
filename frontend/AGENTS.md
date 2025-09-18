# Frontend contributor notes

- Use the Tailwind utility wrappers defined in `src/index.css` (and re-exported via `src/styles/ui.js`) for all shared UI patterns.
- When tweaking or adding tokens, cross-check the static showcase in `docs/theme.html` so updates stay in sync with the documented examples.
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
- Settings now focus on profile essentials: the email reminder fields and in-app notification preferences have been retired for
  every role, so keep the layout lean and avoid reintroducing NotificationContext or bell-style components.
- Admin mentor management lives on `/mentorship`: show mentor cards with linked mentees, allow linking by email, and surface a
  `Delete mentor` control using the shared button tokens so admins can curate relationships gracefully.
- Admin journaler management now has its own `/journalers` route: surface a journaler list with linked mentors, include a search
  affordance, and use the shared button tokens for unlinking mentors and deleting journaler accounts when an admin needs to retire
  access.
- In the Forms builder page, keep the admin view focused on stewardship: do not reintroduce the creation UI for admins, preserve
  the filter controls, and ensure the mentee association list stays actionable with the existing remove affordance.
- Admins now see the form catalogue under the "Form Management" header; keep the copy aligned and pair the filter controls with
  accessible labels (use `sr-only` utilities) so screen readers announce each option clearly.
- The shared `table-header` and `table-row` tokens power the responsive admin tables. They collapse into stacked cards on small
  screens and expand to the three-column grid on medium breakpoints—preserve that pattern when listing forms or similar resources.
  Override the column template with the `--table-grid` CSS variable when a layout needs more (or fewer) columns so headers and rows stay aligned.
- Admin resource tables (journalers, mentors, forms, and journals) now share the same filter mechanics: encode active filters in
  the query string (`q`, `link`, `sharedLevel`, `mentorId`, etc.), normalize search terms to lowercase before requesting data,
  and hydrate initial state from `useSearchParams` so cross-page "view journals" or "view forms" links land on a pre-filtered list.
  Pair every header filter with an `sr-only` label and reuse the `table-header`/`table-row` token grid for consistent responsive
  behavior.
- The journaler and mentor admin pages both expose a `mentorId` focus select. Preserve this when updating filters so deep links
  from the Journals dashboard or mentor cards can highlight a specific guide and keep the `link=linked` context intact.
- When wiring cross-resource navigation, include ID parameters alongside human labels. For example, the Forms admin view now reads
  `creatorId` from the query string to hydrate the creator filter even when a mentor has no display name—always pass the id and an
  optional label when linking from Mentors to Forms.
- `FormBuilderPage` now leans on the table tokens for admin form stewardship. Keep the four-column medium grid (`title`, `visibility`, `assignments`, `actions`) so delete controls and mentee chips stay aligned with the dashboard's other tables by setting `style={{ "--table-grid": "minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.5fr) auto" }}` on both the header and each row.

- `RegisterPage` keeps the password confirmation helper (`syncPasswordMismatchError`) to disable submission and surface the inline
  reminder until both entries match—preserve this flow when adjusting the form.

- Journalers see their assigned forms within `JournalHistoryPage`; keep the poetic CTA that links to `/dashboard?formId=...` using
  the shared `primaryButtonClasses` so each card offers the single-word "Bloom" invitation.
- `SectionCard` now supports optional `sectionRef`, `titleRef`, and `titleProps` arguments so freshly revealed sections can be
  scrolled into view or focused for accessibility. Use them when a flow needs to direct attention to inline content.
- The shared `TagInput` now highlights matching expertise while listing the top 10 popular tags beneath the field. When supplying
  suggestions, pass them in popularity order so mentors always see the gentlest guidance first.


- `GlobalErrorBoundary` wraps the authenticated shell and listens for unhandled promise rejections and window errors. When adjusting global error flows, reuse the boundary’s reset and reload affordances, keep the fallback copy within Aleya’s luminous tone, and prefer surfacing technical details behind the existing "technical whispers" toggle instead of introducing new disclosure patterns.

