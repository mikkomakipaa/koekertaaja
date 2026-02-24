# Multi-Admin Platform Plan

## Goal

Transform the app into a secure multi-admin platform where:
- each admin can create and manage only their own question sets,
- each admin has their own API key configuration,
- Supabase Auth handles self-signup/sign-in,
- school-level separation is supported (as a bonus capability),
- and open design questions are explicitly tracked and validated before implementation.

## Success Criteria

- Admin users can self-register and sign in with Supabase Auth.
- Every question set has an immutable owner (`owner_user_id`) and can be modified only by that owner.
- API-key usage for generation is isolated per admin account.
- Optional school/tenant isolation can be enabled without breaking single-school deployments.
- RLS protects data even if an API route has a bug.

## Proposed Architecture

### 1) Identity and authorization baseline (Supabase Auth)

Use `auth.users` as identity source and connect application data through foreign keys to `auth.users.id`.

Core rule:
- the frontend can only access tables through RLS policies,
- service-role usage in server code should be minimized and never used for owner-scoped writes unless explicitly re-checking ownership.

### 2) Data model updates

Add/extend tables:

- `admin_profiles`
  - `user_id uuid primary key references auth.users(id)`
  - `display_name text`
  - `school_id uuid null` (bonus tenancy)
  - `created_at timestamptz`

- `schools` (bonus)
  - `id uuid primary key`
  - `name text unique`
  - `created_at timestamptz`

- `question_sets` (existing table update)
  - add `owner_user_id uuid not null references auth.users(id)`
  - add `school_id uuid null references schools(id)`
  - add index on `(owner_user_id, created_at desc)`
  - add index on `(school_id, created_at desc)`

- `admin_api_keys`
  - `id uuid primary key`
  - `user_id uuid not null references auth.users(id)`
  - `provider text not null` (e.g. `openai`, `anthropic`)
  - `encrypted_api_key text not null`
  - `key_last4 text not null`
  - `is_active boolean default true`
  - `created_at/updated_at timestamptz`
  - unique `(user_id, provider, is_active)` partial unique for active rows

### 3) RLS policies (critical)

Enable RLS and enforce:

- `question_sets`
  - `select`: owner can read own sets; optional policy to read school-public sets if desired later.
  - `insert`: `owner_user_id = auth.uid()`.
  - `update/delete`: `owner_user_id = auth.uid()`.

- `admin_profiles`
  - user can `select/update` own profile only.

- `admin_api_keys`
  - user can `select/insert/update/delete` only where `user_id = auth.uid()`.

### 4) API route and service-layer changes

Update server endpoints to always resolve authenticated user first and then scope operations by `auth.uid()`:

- create question set route:
  - write `owner_user_id` from session, never from client payload.

- update/delete/extend question set routes:
  - query with `id` + `owner_user_id = auth.uid()` in same statement.

- list question sets for admin UI:
  - default list returns only own sets; optional filter by school if enabled and authorized.

- generation route:
  - resolve active per-admin API key, decrypt server-side, call provider.

### 5) Per-admin API key management

Implementation path:

1. Add admin settings UI (`/admin/settings/api-keys`) for save/rotate/deactivate.
2. Encrypt keys before database write (KMS or libsodium with env-managed master key).
3. Never return full key in API response; only provider + masked value (`••••1234`).
4. Add audit metadata (`last_used_at`, `last_used_provider_model`, `last_error`).

Security requirement:
- all decryption must happen server-side only.

### 6) School separation (bonus tenant model)

Two rollout options:

- **Option A (recommended first): soft tenancy**
  - users optionally linked to `school_id`.
  - ownership rules stay primary; school used for analytics/sharing later.

- **Option B: strict tenancy**
  - enforce `school_id` on sets and policies requiring both ownership or explicit school admin role.

Start with Option A to reduce migration complexity and avoid blocking multi-admin core delivery.

## Migration Plan (incremental)

### Phase 0 — Preflight
- backup DB,
- inventory existing question sets,
- map current creator identity if any metadata exists.

### Phase 1 — Auth + ownership columns
- add `owner_user_id` nullable first,
- backfill existing rows to bootstrap owner account,
- enforce NOT NULL once complete,
- add RLS policies.

### Phase 2 — API hardening
- patch all write routes to use session user,
- ensure no route trusts client-supplied owner fields,
- add negative tests for cross-owner access.

### Phase 3 — API key isolation
- create `admin_api_keys`, settings UI, encryption service,
- route provider calls via per-user key resolver,
- add usage/audit logging.

### Phase 4 — School bonus
- add `schools` and `admin_profiles.school_id`,
- ship school-scoped filtering (read-only first),
- decide whether to move to strict tenancy.

## Open Questions to Validate (Design Review Checklist)

These must be answered before implementation freeze:

1. **Self-signup policy**
   - Fully open signup, domain allowlist, or invite-only?
2. **First-owner assignment for legacy data**
   - Which user should own existing question sets?
3. **School model**
   - Can an admin belong to multiple schools?
4. **Cross-admin collaboration**
   - Is sharing/edit delegation needed now or later?
5. **API key model**
   - One key per provider per user, or multiple named keys?
6. **Provider fallback behavior**
   - If user lacks provider key, deny request or fallback to platform key?
7. **Audit and compliance**
   - What retention period is required for key usage and content generation logs?
8. **Operational recovery**
   - Who can recover an account if owner is locked out?
9. **Data export/deletion**
   - Need per-admin export and GDPR-style deletion workflow?
10. **Rate limits and abuse controls**
   - Per-user, per-school, and global limits required?

## Validation and Testing Strategy

- Unit tests:
  - ownership checks for create/update/delete flows,
  - API key resolver by authenticated user.
- Integration tests:
  - RLS policy tests for allowed vs denied actions,
  - cross-user access rejection for all admin routes.
- Security tests:
  - verify decrypted keys are never logged,
  - verify service-role paths cannot bypass ownership without explicit guard.
- Migration tests:
  - backfill correctness,
  - rollback script for `owner_user_id` migration.

## Recommended Delivery Sequence

1. Ownership + RLS first (highest security impact).
2. Per-admin API keys second (functional isolation).
3. School separation third (optional tenancy).
4. Collaboration roles last (if needed).

This sequence minimizes risk while delivering immediate multi-admin safety.
