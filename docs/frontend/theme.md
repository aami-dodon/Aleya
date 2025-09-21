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
- Buttons: `btn-primary`, `btn-secondary`, `btn-subtle`, `btn-danger`, and circular `icon-button` share rounded 2xl shapes and motion hover states.
- Forms: `form-input`, `form-input-compact`, `form-select`, `form-select-compact`, `form-textarea`, `form-checkbox` apply frosted backgrounds and emerald focus rings.
- Feedback + layout: `empty-state`, `card-container`, `table-header`, `table-row`, `chip-base`, `badge-base`, `section-title`, `section-subtitle` keep admin tables, cards, and chips consistent.
- Status helpers: `getMoodBadgeClasses`, `getShareChipClasses`, and `getStatusToneClasses` map moods, share levels, and mentor request states to Tailwind utility blends.

## Motion & Depth
- Buttons ease upward with subtle translate-y hover states and focus outlines.
- Cards and tables lean on `shadow-emerald-900/10` with rounded-3xl borders to preserve the soft canopy aesthetic.
