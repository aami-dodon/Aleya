# Theme

## Palette
- **Background wash:** Emerald gradients (`bg-emerald-50 → bg-emerald-100`) keep pages soft and nature-forward.
- **Primary:** Emerald 600 for actions, with Emerald 500 hover states (`btn-primary`).
- **Secondary:** White-on-emerald outlines using Emerald 200 borders and Emerald 700 text (`btn-secondary`).
- **Danger:** Rose 600 for SOS flows and destructive confirmations.
- **Accents:** Amber 100/600 for highlights, Teal 600 for mentor layers, Sky 100/700 for reflective cards.

## Typography Tokens
- `text-display`, `text-heading-lg/md/sm/xs` scale hero, section, and card headings.
- `text-body-lg/body/body-sm` cover narrative copy with relaxed leading.
- `text-body-sm-strong`, `text-eyebrow`, and `text-caption` handle emphasis, uppercase badges, and table labels.
- `form-label` keeps input guidance in Emerald 900/80 for accessibility.

## Component Tokens
- Buttons: `btn-primary`, `btn-secondary`, `btn-subtle`, `btn-danger`, and circular `icon-button` share rounded 2xl shapes and motion hover states; compact variants (`btn-primary-compact`, `btn-secondary-compact`) plus padding helpers (`button-pad-*`), layout utilities (`button-block`, `button-responsive`), and `icon-sm` keep actions balanced across contexts.
- Layout & navigation: `app-shell`, `app-header*`, `primary-nav*`, `mobile-menu*`, `auth-controls*`, and spacing helpers (`stack-*`, `cluster-*`) orchestrate the shell, navigation, and responsive spacing.
- Forms: `form-input`, `form-input-compact`, `form-select`, `form-select-compact`, `form-textarea`, `form-checkbox`, and support classes (`form-*` helpers, status banners, `form-actions`) apply frosted backgrounds, emerald focus rings, and consistent feedback styling.
- Feedback + layout: `empty-state`, `card-container`, `table-header`, `table-row`, `chip-base`, `badge-base`, `section-title`, `section-subtitle`, `section-card__*`, `error-*`, and `dialog-*` keep admin tables, cards, dialogs, and fallbacks consistent.
- Dashboard metrics and charts: `metric-card*`, `mood-chart*` (including `mood-chart__legend-copy`), and `loading-state*` unify stats, sparklines, and loading affordances across dashboards.
- Interactive lists & inputs: `request-list`, `request-card*`, `request-status--*`, and `tag-input*` align mentorship requests and chip-style inputs with the shared emerald styling.
- Status helpers: `getMoodBadgeClasses`, `getShareChipClasses`, and `getStatusToneClasses` now return CSS token blends (`badge-mood-*`, `chip-share-*`, `request-status--*`) so components never reach for raw Tailwind utilities.

## Motion & Depth
- Buttons ease upward with subtle translate-y hover states and focus outlines.
- Cards and tables lean on `shadow-emerald-900/10` with rounded-3xl borders to preserve the soft canopy aesthetic.
