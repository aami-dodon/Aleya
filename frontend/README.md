# Aleya frontend

The Aleya web client is a [Create React App](https://create-react-app.dev/) project that uses Tailwind CSS for layout and component styling.

## Local development

```bash
cd frontend
npm install
npm start
```

The development server runs on http://localhost:3000. Use `npm test` to launch the Jest test runner and `npm run build` to create a production build.

## Design system

All reusable styles live in `src/index.css` under a `@layer components` block. These classes wrap Tailwind utilities so that typography, buttons, form controls, and feedback states stay consistent across the application.

### Typography

| Token | Description |
| --- | --- |
| `text-display` | Hero headlines (4xl/5xl, bold, tight tracking). |
| `text-heading-lg`, `text-heading-md`, `text-heading-sm`, `text-heading-xs` | Section titles from 3xl down to lg weights. |
| `text-body-lg`, `text-body`, `text-body-strong` | Paragraph copy with relaxed leading and optional emphasis. |
| `text-body-sm`, `text-body-sm-strong`, `text-body-sm-muted` | Small copy, helper text, and compact emphasis. |
| `text-eyebrow`, `text-caption` | Uppercase eyebrow and caption treatments. |
| `form-label` | Standard field label styling. |

Typography tokens only control font sizing, weight, and tracking. Apply contextual colours (e.g. `text-emerald-900`, `text-white/80`) alongside these classes where required.

### Buttons

| Token | Description |
| --- | --- |
| `btn-primary` | Primary call-to-action button with emerald background. |
| `btn-secondary` | Secondary action with subtle border and white backdrop. |
| `btn-subtle` | Minimal button for tertiary actions and links. |

### Form controls

| Token | Description |
| --- | --- |
| `form-input`, `form-input-compact` | Text inputs for regular and dense layouts. |
| `form-textarea` | Multiline journal fields. |
| `form-select`, `form-select-compact` | Dropdowns with matching rounded styling. |
| `form-checkbox` | Checkbox styling aligned with emerald focus rings. |

### Feedback & layout helpers

| Token | Description |
| --- | --- |
| `card-container` | Frosted glass card container used on dashboards. |
| `table-header`, `table-row` | Dashboard tables with responsive grids. |
| `chip-base`, `badge-base` | Base styling for chips and badges (tone comes from context). |
| `empty-state`, `text-info`, `text-muted` | Empty state containers and helper copy. |

Refer to `src/styles/ui.js` for the exported constants and helper functions (`getMoodBadgeClasses`, `getShareChipClasses`, etc.) used throughout the component tree.

## Linting & formatting

This project relies on Prettier formatting through Tailwind's `@apply` utilities. Run `npm test` to execute the Jest suite; additional linters can be added later if needed.
