# Components

## Layout
- **Location:** `frontend/src/components/Layout.js`
- **Props:** `children`
- **Purpose:** Wraps authenticated + marketing shells with sticky header, role-based navigation, PanicButton, and auth controls.
- **Dependencies:** `AuthContext` for user/session info, `react-router-dom` for links, `PanicButton` for SOS dialog, Tailwind tokens from `styles/ui`.

## GlobalErrorBoundary
- **Location:** `frontend/src/components/GlobalErrorBoundary.js`
- **Props:** `children`
- **Purpose:** Captures render/runtime errors, listens for promise rejections, and renders a luminous fallback with reset + reload options.
- **Dependencies:** Browser `window` events, `useEffect`, `useState` for boundary lifecycle.

## JournalEntryForm
- **Location:** `frontend/src/components/JournalEntryForm.js`
- **Props:** `forms`, `selectedForm`, `onSelectForm`, `onSubmit`, `submitting`, `statusMessage`, `statusVariant`, `onStatusClose`, `formResetKey`
- **Purpose:** Renders mentor-authored prompts, collects responses, mood, share level, and summary for new journal entries.
- **Dependencies:** `TagInput` for gratitude/expertise tags, UI tokens for inputs, `getShareChipClasses` for share level hints.

## MetricCard
- **Location:** `frontend/src/components/MetricCard.js`
- **Props:** `title`, `value`, `caption`, `trend`, `tone`
- **Purpose:** Displays journaler and mentor dashboard metrics with optional sparkline trend chips.
- **Dependencies:** UI tokens (`card-container`, typography) and mood helpers for color coding.

## MoodTrendChart
- **Location:** `frontend/src/components/MoodTrendChart.js`
- **Props:** `data`, `title`, `emptyLabel`
- **Purpose:** Renders a responsive SVG line chart of mood or wellbeing scores across selectable timeframes.
- **Dependencies:** Pure React/SVG; consumes `getMoodBadgeClasses` for tooltips.

## MentorRequestList
- **Location:** `frontend/src/components/MentorRequestList.js`
- **Props:** `requests`, `onAccept`, `onConfirm`, `onDecline`, `loading`
- **Purpose:** Lists mentorship requests for both roles, exposing action buttons and status chips.
- **Dependencies:** UI button tokens, `getStatusToneClasses` for state coloring.

## MentorProfileDialog
- **Location:** `frontend/src/components/MentorProfileDialog.js`
- **Props:** `mentor`, `onClose`, `onLink`, `linking`
- **Purpose:** Modal for admins to review mentor bios/expertise and link journalers.
- **Dependencies:** Shared modal layout pattern (`fixed inset-0`, scrollable panel), UI buttons, `TagInput` for expertise chips.

## PanicButton
- **Location:** `frontend/src/components/PanicButton.js`
- **Props:** None
- **Purpose:** Journaler-only SOS launcher that fetches linked mentors, sends panic alerts, and surfaces success/error copy.
- **Dependencies:** `AuthContext` for token + role, `/mentors/support-network` + `/mentors/panic-alerts` API calls via `apiClient`.

## SectionCard
- **Location:** `frontend/src/components/SectionCard.js`
- **Props:** `title`, `subtitle`, `actions`, `children`, `sectionRef`, `titleRef`, `titleProps`
- **Purpose:** Section wrapper for dashboards, supporting focus/scroll targeting to improve accessibility.
- **Dependencies:** UI card + typography tokens; forwards refs for guided flows.

## TagInput
- **Location:** `frontend/src/components/TagInput.js`
- **Props:** `label`, `name`, `value`, `onChange`, `suggestions`, `placeholder`, `disabled`
- **Purpose:** Tokenized multi-select input used for mentor expertise and gratitude tags with suggestion dropdown.
- **Dependencies:** `useExpertiseSuggestions` for mentor flows, UI chip tokens, keyboard navigation handlers.

## LoadingState
- **Location:** `frontend/src/components/LoadingState.js`
- **Props:** `label`
- **Purpose:** Displays animated shimmer and poetic loading text during async fetches and route guards.
- **Dependencies:** UI typography tokens.
