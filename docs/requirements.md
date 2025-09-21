### Features
- Guided journaling flows with mentor-authored forms, mood capture, share-level controls (`private`, `mood`, `summary`, `full`), CSV export, and mentor comment threads for shared entries. 【F:docs/frontend/pages.md†L21-L55】【F:docs/backend/endpoints.md†L41-L120】
- Consent-based mentorship lifecycle covering mentor discovery, request → accept → confirm linking, mentee assignment to forms, panic support roster, and scheduled mentor digests. 【F:docs/frontend/pages.md†L57-L104】【F:docs/backend/endpoints.md†L122-L207】
- Administrative stewardship dashboards that surface platform metrics, manage mentors/journalers, moderate journals, and tune form visibility while respecting default template protections. 【F:docs/frontend/pages.md†L65-L118】【F:docs/backend/endpoints.md†L209-L240】

### User Stories
- As a prospective member, I can register as a journaler or mentor, capture my timezone and expertise, and verify my email so that I can access the correct dashboard securely. 【F:docs/frontend/pages.md†L13-L35】【F:docs/backend/endpoints.md†L4-L31】
- As a journaler, I can complete guided prompts, choose my sharing level, and save reflections so that my wellbeing log respects my privacy preferences. 【F:docs/frontend/pages.md†L23-L49】【F:docs/backend/endpoints.md†L75-L113】
- As a journaler, I can revisit, filter, edit, delete, and export past entries so that I can reflect on trends and share insights offline. 【F:docs/frontend/pages.md†L42-L49】【F:docs/backend/endpoints.md†L89-L104】
- As a journaler, I can browse mentors, send or confirm requests, and manage my support network so that I stay connected with trusted guides. 【F:docs/frontend/pages.md†L51-L58】【F:docs/backend/endpoints.md†L123-L155】
- As a journaler, I can trigger a panic alert to linked mentors with a custom message so that I can request immediate care during crises. 【F:docs/frontend/pages.md†L51-L58】【F:docs/frontend/pages.md†L85-L88】【F:docs/backend/endpoints.md†L158-L165】
- As a mentor, I can review pending mentorship requests and monitor mentee mood trends and alerts so that I can prioritise timely outreach. 【F:docs/frontend/pages.md†L32-L35】【F:docs/backend/endpoints.md†L129-L145】【F:docs/backend/endpoints.md†L119-L122】
- As a mentor, I can craft custom journal forms, assign them to mentees, and leave comments on shared entries so that I can tailor support to each person. 【F:docs/frontend/pages.md†L70-L75】【F:docs/backend/endpoints.md†L44-L113】
- As a mentor, I can export mentee reflections and receive real-time and digest emails so that I stay informed even when away from the dashboard. 【F:docs/frontend/pages.md†L42-L49】【F:docs/backend/endpoints.md†L97-L100】【F:backend/src/utils/emailTemplates.js†L284-L358】【F:backend/src/utils/emailTemplates.js†L365-L476】
- As an admin, I can review platform metrics, forms, and recent journals so that the community stays healthy and content remains moderated. 【F:docs/frontend/pages.md†L37-L68】【F:docs/backend/endpoints.md†L167-L218】
- As an admin, I can link or unlink mentors and journalers and retire accounts so that safety issues are resolved quickly. 【F:docs/frontend/pages.md†L51-L63】【F:docs/backend/endpoints.md†L198-L209】
- As any authenticated user, I can update my profile details or close my account so that my information stays accurate and under my control. 【F:docs/frontend/pages.md†L77-L83】【F:docs/backend/endpoints.md†L17-L29】

### Acceptance Criteria
- Only verified accounts gain dashboard access; registration issues verification tokens and the API blocks unverified logins until the email link is confirmed. 【F:docs/backend/endpoints.md†L5-L34】
- Journalers can create, edit, delete, and export their entries, while mentors only retrieve reflections shared beyond the `private` level and comments remain scoped to linked mentors. 【F:docs/backend/endpoints.md†L73-L171】
- Mentorship tooling (form assignments, requests, panic alerts) is available only after mutual confirmation, and admins can intervene through mentor/journaler linking routes without bypassing consent history. 【F:docs/backend/endpoints.md†L122-L207】【F:docs/frontend/pages.md†L57-L96】

### Data Models
- **users**: id, email, password_hash, name, role (`journaler`, `mentor`, `admin`), timezone, is_verified, verification_token_hash, verification_token_expires_at, created_at, updated_at. 【F:docs/backend/models.md†L4-L12】
- **mentor_profiles**: user_id, expertise, availability, bio, created_at, updated_at (extends mentor accounts). 【F:docs/backend/models.md†L14-L19】
- **mentor_requests**: id, journaler_id, mentor_id, status, message, timestamps (ensures one pending request per pair). 【F:docs/backend/models.md†L21-L30】
- **mentor_links**: id, journaler_id, mentor_id, established_at (mutual confirmation record). 【F:docs/backend/models.md†L32-L38】
- **journal_forms**: id, title, description, visibility (`default`, `mentor`, `admin`), created_by, is_default, created_at. 【F:docs/backend/models.md†L40-L47】
- **journal_form_fields**: id, form_id, label, field_type, required, options, helper_text. 【F:docs/backend/models.md†L49-L55】
- **mentor_form_assignments**: id, mentor_id, journaler_id, form_id, assigned_at. 【F:docs/backend/models.md†L57-L63】
- **journal_entries**: id, journaler_id, form_id, entry_date, responses (JSONB), mood, shared_level, summary, created_at. 【F:docs/backend/models.md†L65-L73】
- **entry_comments**: id, entry_id, mentor_id, comment, created_at. 【F:docs/backend/models.md†L75-L82】

### APIs
- `POST /api/auth/register` – Creates journaler or mentor accounts, seeds mentor profile data, and emails verification links. 【F:docs/backend/endpoints.md†L5-L18】
- `GET /api/forms` – Returns journaling forms tailored to the requester’s role, including assignments for journalers and mentors. 【F:docs/backend/endpoints.md†L41-L69】
- `POST /api/journal-entries` – Persists a reflection, enforces share-level rules, and triggers mentor notifications for non-private entries. 【F:docs/backend/endpoints.md†L73-L119】【F:docs/backend/services.md†L1-L27】
- `POST /api/mentors/requests/:id/confirm` – Finalises mentorship after mentor acceptance and records the link for future assignments. 【F:docs/backend/endpoints.md†L140-L165】
- `GET /api/admin/journals` – Lets admins filter and moderate shared entries across mentees and mentors. 【F:docs/backend/endpoints.md†L223-L233】

### UI Components
- Journaling and analytics shell: `JournalEntryForm`, `MetricCard`, `MoodTrendChart`, and `SectionCard` orchestrate entry capture and wellbeing insights. 【F:docs/frontend/components.md†L13-L55】
- Mentorship and safety components: `MentorRequestList`, `MentorProfileDialog`, and `PanicButton` manage invitations, admin linking, and SOS outreach. 【F:docs/frontend/components.md†L57-L93】

### Emails
- Verification email delivered during registration to activate accounts before dashboard access. 【F:backend/src/utils/emailTemplates.js†L340-L533】
- Immediate mentor entry notification summarising shared mood, summary, or full reflections depending on share level. 【F:backend/src/utils/emailTemplates.js†L260-L339】
- Scheduled mentor digest email bundling mentee reflections over a configurable window for asynchronous care. 【F:backend/src/utils/emailTemplates.js†L188-L259】

### Metrics
- Dashboard analytics calculate streak length, average mood scores, mood and wellbeing trends, and flag crisis keywords inside reflections. 【F:backend/src/utils/metrics.js†L1-L119】

### Dependencies
- Backend: Express 5 API with PostgreSQL (`pg`), JWT auth, `express-validator`, Winston logging, Nodemailer for email, and Jest/Prettier/ESLint for quality gates. 【F:backend/package.json†L1-L34】
- Frontend: React 19 with React Router, date-fns utilities, Testing Library suite, Tailwind CSS build tooling, and CRA scripts. 【F:frontend/package.json†L1-L35】

### Definition of Done
- Requirements reviewed against source docs, email + dashboard flows verified, role-based permissions confirmed, automated checks (`format:check`, `lint`, `test`) scheduled for backend, and documentation (`docs/`, `AGENTS.md`) updated when behaviour shifts. 【F:docs/backend/AGENTS.md†L1-L28】【F:README.md†L35-L116】
