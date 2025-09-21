# Components

## Layout
- **Location:** `frontend/src/components/Layout.js`
- **Props:** `children`
- **Purpose:** Wraps authenticated + marketing shells with sticky header, role-based navigation, PanicButton, and auth controls.
- **Dependencies:** `AuthContext` for user/session info, `react-router-dom` for links, `PanicButton` for SOS dialog, and layout tokens (`app-shell`, `primary-nav*`, `mobile-menu*`, `auth-controls*`, `button-pad-*`, `button-responsive`, `icon-sm`) from `styles/ui`.

## GlobalErrorBoundary
- **Location:** `frontend/src/components/GlobalErrorBoundary.js`
- **Props:** `children`
- **Purpose:** Captures render/runtime errors, listens for promise rejections, and renders a luminous fallback with reset + reload options.
- **Dependencies:** Browser `window` events, `useEffect`, `useState` for boundary lifecycle, and `error-*` + `button-pad-md` tokens for the fallback surface.

## JournalEntryForm
- **Location:** `frontend/src/components/JournalEntryForm.js`
- **Props:** `form`, `onSubmit`, `submitting`, `defaultSharing`, `initialSharing`, `initialValues`, `statusMessage`, `statusVariant`, `submitLabel`, `onCancel`
- **Purpose:** Renders mentor-authored prompts, collects responses, and persists the sharing level for new journal entries.
- **Dependencies:** Form tokens (`form-*`), input tokens, and button helpers (`button-responsive`, `button-pad-*`) from `styles/ui`.

## MetricCard
- **Location:** `frontend/src/components/MetricCard.js`
- **Props:** `title`, `value`, `description`, `children`
- **Purpose:** Displays dashboard metrics with optional supporting copy or custom child content.
- **Dependencies:** Metric card token exports (`metric-card*`) from `styles/ui` keep typography and padding aligned.

## MoodTrendChart
- **Location:** `frontend/src/components/MoodTrendChart.js`
- **Props:** `data`
- **Purpose:** Renders a responsive SVG line chart of recent mood or wellbeing scores with a legend of the latest entries.
- **Dependencies:** `date-fns` for formatting and `styles/ui` mood chart tokens (including `mood-chart__legend-copy`) for layout; falls back to `emptyStateClasses` when no data exists.

## MentorRequestList
- **Location:** `frontend/src/components/MentorRequestList.js`
- **Props:** `requests`, `role`, `onAccept`, `onConfirm`, `onDecline`, `onEnd`
- **Purpose:** Lists mentorship requests for mentors and journalers, surfacing action buttons and status copy per state.
- **Dependencies:** Compact button tokens (`btn-primary-compact`, `btn-secondary-compact`), request list classes (`request-list`, `request-card*`), and status tone helpers (`request-status--*`).

## MentorProfileDialog
- **Location:** `frontend/src/components/MentorProfileDialog.js`
- **Props:** `mentor`, `onClose`, `onRequest`, `canRequest`
- **Purpose:** Journaler-facing modal that reveals mentor expertise, bio, and availability with an optional request CTA.
- **Dependencies:** Shared dialog tokens (`dialog-*`, `button-pad-*`) plus chip tokens for consistent styling.

## PanicButton
- **Location:** `frontend/src/components/PanicButton.js`
- **Props:** None
- **Purpose:** Journaler-only SOS launcher that fetches linked mentors, sends panic alerts, and surfaces success/error copy.
- **Dependencies:** `AuthContext` for token + role, `/mentors/support-network` + `/mentors/panic-alerts` API calls via `apiClient`, and dialog tokens shared with the mentor profile modal.

## SectionCard
- **Location:** `frontend/src/components/SectionCard.js`
- **Props:** `title`, `subtitle`, `actions`, `children`, `sectionRef`, `titleRef`, `titleProps`
- **Purpose:** Section wrapper for dashboards, supporting focus/scroll targeting to improve accessibility.
- **Dependencies:** UI card + typography tokens and section layout helpers (`section-card__*`); forwards refs for guided flows.

## TagInput
- **Location:** `frontend/src/components/TagInput.js`
- **Props:** `value`, `onChange`, `placeholder`, `suggestions`, `allowCustom`
- **Purpose:** Tokenised multi-select input used for expertise chips with auto-complete suggestions and custom entry support.
- **Dependencies:** `parseExpertise` for normalising values and tag input token exports (`tag-input*`) for consistent styling.

## LoadingState
- **Location:** `frontend/src/components/LoadingState.js`
- **Props:** `label`, `compact`
- **Purpose:** Displays poetic loading copy either full-height or inline while async data resolves.
- **Dependencies:** Loading state tokens (`loading-state*`) from `styles/ui`.
