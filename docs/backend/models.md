# Models

## users
- `id` (PK, serial)
- `email`, `password_hash`, `name`, `role` (`journaler`, `mentor`, `admin`), `timezone`
- `is_verified`, `verification_token_hash`, `verification_token_expires_at`
- Timestamps: `created_at`, `updated_at`

## password_reset_tokens
- `user_id` (PK, FK → users, cascades on delete)
- `token_hash`
- `expires_at`
- `created_at`
- Indexes: unique hash (`idx_password_reset_tokens_hash`), expiry lookup (`idx_password_reset_tokens_expires_at`)

## mentor_profiles
- `user_id` (PK, FK → users)
- `expertise`, `availability`, `bio`
- Timestamps: `created_at`, `updated_at`

## mentor_requests
- `id` (PK)
- `journaler_id`, `mentor_id` (FK → users)
- `status` (`pending`, `mentor_accepted`, `confirmed`, `declined`, `ended`)
- `message`, timestamps
- Unique pair per journaler + mentor

## mentor_links
- `id` (PK)
- `journaler_id`, `mentor_id` (FK → users)
- `established_at`
- Unique pair per journaler + mentor

## journal_forms
- `id` (PK)
- `title`, `description`, `visibility` (`default`, `mentor`, `admin`)
- `created_by` (FK → users, nullable), `is_default`
- `created_at`

## journal_form_fields
- `id` (PK)
- `form_id` (FK → journal_forms)
- `label`, `field_type`, `required`, `options` (JSONB), `helper_text`

## mentor_form_assignments
- `id` (PK)
- `mentor_id`, `journaler_id` (FK → users)
- `form_id` (FK → journal_forms)
- `assigned_at`
- Unique `(journaler_id, form_id)` guard

## journal_entries
- `id` (PK)
- `journaler_id` (FK → users)
- `form_id` (FK → journal_forms)
- `entry_date`, `responses` (JSONB), `mood`, `shared_level` (`private`, `mood`, `summary`, `full`), `summary`
- `created_at`

## entry_comments
- `id` (PK)
- `entry_id` (FK → journal_entries)
- `mentor_id` (FK → users)
- `comment`, `created_at`

### Indexes
- `idx_journal_entries_user_date`
- `idx_mentor_assignments_journaler`
- `idx_mentor_links_journaler`
