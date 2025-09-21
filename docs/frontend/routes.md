# Routes

- `/` → `LandingPage` (public)
- `/login` → `LoginPage` (public)
- `/forgot-password` → `ForgotPasswordPage` (public)
- `/reset-password` → `ResetPasswordPage` (public token handling)
- `/register` → `RegisterPage` (public)
- `/verify-email` → `VerifyEmailPage` (public token processing)
- `/dashboard` → role router (`JournalerDashboard`, `MentorDashboard`, `AdminDashboard`) (protected)
- `/journal/history` → `JournalHistoryPage` (protected; journalers + mentors)
- `/mentorship` → `MentorConnectionsPage` (protected; all roles)
- `/journalers` → `JournalerManagementPage` (protected; admins)
- `/journals` → `JournalAdminPage` (protected; admins)
- `/forms` → `FormBuilderPage` (protected; mentors + admins)
- `/settings` → `SettingsPage` (protected; all roles)
- `*` → redirect to `/`
