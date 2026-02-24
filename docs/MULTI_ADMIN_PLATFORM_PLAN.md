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

## Review Outcome (Updated)

Plan status after review: **conditionally approved**.

Before implementation starts, the following blockers must be resolved because they affect security-critical behavior or migration correctness:

1. **Auth enforcement approach is still undecided** (middleware + route client pattern).
2. **Legacy owner backfill owner is not yet selected** (blocks `owner_user_id NOT NULL`).
3. **Public read behavior for published sets must be explicitly preserved** to avoid breaking student game joins.
4. **API key encryption and rotation strategy must be chosen up front** (Vault/KMS vs libsodium).
5. **GDPR delivery is mandatory and must be phased as deliverables, not only listed as open questions**.

Implementation should not proceed past Phase 0/1 gates until these are closed in writing.

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

- `student_profiles` (new — Phase 5)
  - `id uuid primary key`
  - `display_name text not null`
  - `join_token text unique not null` (random UUID, stored in client localStorage)
  - `school_id uuid null references schools(id)`
  - `created_at timestamptz`
  - index on `join_token` (lookup path for every game join)

- `admin_api_keys`
  - `id uuid primary key`
  - `user_id uuid not null references auth.users(id)`
  - `provider text not null` (e.g. `openai`, `anthropic`)
  - `encrypted_api_key text not null`
  - `key_last4 text not null`
  - `is_active boolean default true`
  - `created_at/updated_at timestamptz`
  - partial unique index on `(user_id, provider)` where `is_active = true`

### 3) RLS policies (critical)

Enable RLS and enforce:

- `question_sets`
  - `select`: owner can read own sets; optional policy to read school-public sets if desired later.
    - **Note**: the current policy makes all `published` sets publicly readable (required for the student play flow via access code). This policy must be explicitly preserved or replaced — tightening it without a matching read policy will break the student game entry flow.
  - `insert`: `owner_user_id = auth.uid()`.
  - `update/delete`: `owner_user_id = auth.uid()`.

- `admin_profiles`
  - user can `select/update` own profile only.

- `admin_api_keys`
  - user can `select/insert/update/delete` only where `user_id = auth.uid()`.

- `student_profiles`
  - no direct client table access (students are not Supabase Auth users).
  - all reads/writes go through a dedicated server-side route that validates the `join_token` from a signed session cookie before touching the table.
  - service role used exclusively; no anon key access permitted.

### 4) API route and service-layer changes

Update server endpoints to always resolve authenticated user first and then scope operations by `auth.uid()`.

**Application-layer auth must be specified explicitly.** RLS is the authoritative backstop, but unauthenticated requests still reach route handler logic before being rejected at the DB. A concrete spec is needed for:
- which Supabase client helper is used in route handlers (`createRouteHandlerClient` vs `createServerActionClient` vs service role),
- whether a Next.js `middleware.ts` guards admin pages and API routes before handler execution,
- how admin-only pages (e.g. `/admin/settings/api-keys`) are protected at the page/layout level.

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
2. Encrypt keys before database write — **choose one approach before Phase 3 starts**:
   - **Supabase Vault / KMS**: managed rotation, audit trail, higher operational overhead.
   - **libsodium with env-managed master key**: simpler, but key rotation requires re-encrypting all stored rows.
3. Never return full key in API response; only provider + masked value (`••••1234`).
4. Add audit metadata (`last_used_at`, `last_used_provider_model`, `last_error`).
5. Add `tokens_used` and `estimated_cost_usd` audit columns to `admin_api_keys` or a linked usage log table — required for per-user budget enforcement and abuse detection.

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

### 7) User profiles — teacher and student

The platform has two distinct user types with different identity requirements.

#### Teacher profile (`admin_profiles`)

Already defined in section 2. Teachers authenticate via Supabase Auth and have a full account.

Minimal required fields:
- `user_id` — FK to `auth.users(id)`, primary key
- `display_name text` — shown in admin UI and (optionally) to students during a game
- `school_id uuid null` — optional school link (Phase 4)
- `created_at timestamptz`

No additional fields are needed at launch. Do not add phone, address, or role-title fields unless a concrete feature requires them.

#### Student profile (`student_profiles`)

Students must not be required to create an account. Classroom use demands zero-friction entry — asking students to register with an email breaks the game flow.

Design: **token-based pseudonymous identity**

How it works:
1. On first game join, the client generates a random UUID `join_token` and stores it in `localStorage`.
2. The server creates (or looks up) a `student_profiles` row keyed by that token.
3. On subsequent visits the same token is sent, restoring the student's display name and history.
4. If `localStorage` is cleared the student enters as a new anonymous participant — this is acceptable.

Minimal required fields:
- `id uuid primary key`
- `display_name text not null` — chosen by the student at game entry (e.g. "Mikko", "Player 1")
- `join_token text unique not null` — random UUID generated client-side; never displayed
- `school_id uuid null references schools(id)` — optionally assigned when a teacher creates a class session
- `created_at timestamptz`

Explicitly excluded to keep data minimal and reduce GDPR surface:
- no email
- no real name field (display name is self-chosen and not verified)
- no password or PIN
- no date of birth
- no device fingerprint

Data retention: student profiles with no linked sessions older than the configured retention period (see open question 7) should be deleted by a scheduled job.

RLS for `student_profiles`:
- direct RLS policies are intentionally not exposed to browser clients.
- all operations (`select/insert/update/delete`) are executed by a tightly scoped server-side service layer after join-token validation.
- no endpoint may return rows across tokens; handlers must always scope by a single validated token.

## Migration Plan (incremental)

### Phase 0 — Preflight
- backup DB,
- inventory existing question sets,
- map current creator identity if any metadata exists,
- **resolve pre-existing security baseline** (must complete before auth is added):
  - add rate limiting to `/api/generate-questions` (Task 091),
  - replace `Math.random()` game code generation with cryptographically secure alternative (codes are currently predictable and enumerable),
  - fix questions RLS policy bug (Task 090),
  - add Content-Security-Policy headers,
- **decide self-signup policy** (gates Phase 1 — open signup without rate limits + per-user budget is equivalent to no rate limiting),
- **decide legacy data backfill owner** (gates Phase 1 — `NOT NULL` enforcement cannot complete without this).

Exit criteria:
- security baseline tasks completed and verified,
- self-signup policy decision documented,
- legacy backfill owner decision documented.

### Phase 1 — Auth + ownership columns
- add `owner_user_id` nullable first,
- backfill existing rows to bootstrap owner account,
- enforce NOT NULL once complete,
- add RLS policies.

Exit criteria:
- `question_sets.owner_user_id` is non-null for all rows,
- anonymous read path for published sets is validated with an automated test,
- cross-owner write attempts fail in tests.

### Phase 2 — API hardening
- patch all write routes to use session user — routes to cover (exhaustive list must be verified before this phase closes):
  - `POST /api/generate-questions`
  - `PATCH /api/question-sets/publish`
  - `POST /api/identify-topics`
  - flag/unflag routes
  - any routes that accept a `question_set_id` or owner-scoped resource ID
- ensure no route trusts client-supplied owner fields,
- add Next.js middleware (`middleware.ts`) enforcing session checks before route handlers are reached,
- add negative tests for cross-owner access.

Exit criteria:
- write-route inventory is signed off as exhaustive,
- middleware is enabled for all admin pages and admin API prefixes,
- route tests confirm unauthenticated requests fail before DB writes are attempted.

### Phase 3 — API key isolation
- create `admin_api_keys`, settings UI, encryption service,
- route provider calls via per-user key resolver,
- add usage/audit logging.

Exit criteria:
- encryption/rotation strategy is implemented and documented,
- full key material is never returned by API responses or logs,
- per-user token and cost usage is queryable for budget enforcement.

### Phase 4 — School bonus
- add `schools` and `admin_profiles.school_id`,
- ship school-scoped filtering (read-only first),
- decide whether to move to strict tenancy.

### Phase 5 — User profiles
- create `student_profiles` table with `join_token` index,
- implement server-side join-token session cookie flow (set on first game entry, validated on subsequent requests),
- add `student_id` FK to `game_sessions` (depends on session persistence being introduced alongside or before this phase),
- add teacher profile display in admin UI (display name shown on question set list and dashboard),
- add student data retention scheduled job (delete profiles with no sessions older than configured period),
- verify no student PII is stored beyond display name and token.

Exit criteria:
- student join-token flow works end-to-end without Supabase Auth login,
- retention cleanup job is deployed with configured retention window,
- GDPR deletion path covers both admin-owned data and student pseudonymous profiles.

## Open Questions to Validate (Design Review Checklist)

These must be answered before implementation freeze:

### Original questions

1. **Self-signup policy** *(blocks Phase 0 — must decide before auth is wired)*
   - Fully open signup, domain allowlist, or invite-only?
   - Note: open signup without per-user generation budgets and rate limits is functionally equivalent to removing rate limiting (each abuser creates a new account).

2. **First-owner assignment for legacy data** *(blocks Phase 1 — `NOT NULL` cannot be enforced until decided)*
   - Which user should own existing question sets?
   - Recommended: create a designated bootstrap admin account during Phase 0 preflight and assign all legacy rows to it, with the option for real owners to claim their sets later.

3. **School model**
   - Can an admin belong to multiple schools?

4. **Cross-admin collaboration**
   - Is sharing/edit delegation needed now or later?

5. **API key model**
   - One key per provider per user, or multiple named keys?
   - Clarify: after a key is deactivated, can the user have both an inactive and a new active key for the same provider simultaneously? Define the intended key history model.

6. **Provider fallback behavior**
   - If user lacks a provider key, deny the request or fall back to the platform key?

7. **Audit and compliance**
   - What retention period is required for key usage and content generation logs?

8. **Operational recovery**
   - Who can recover an account if the owner is locked out?

9. **Data export/deletion** *(see also question 15 — GDPR is mandatory for Finnish school platforms)*
   - Need per-admin export and GDPR-style deletion workflow?

10. **Rate limits and abuse controls**
    - Per-user, per-school, and global limits required?

### Additional questions (from implementation review)

11. **Student identity model** *(addressed in Phase 5 — see section 7)*
    - Resolved: students use token-based pseudonymous profiles (no Supabase Auth account required).
    - Remaining decision: should a teacher be able to pre-provision student profiles with class-assigned display names, or is self-chosen entry-time naming sufficient?

12. **Session and progress persistence**
    - Game sessions are currently in-memory only; there is no `game_sessions` or `session_answers` table.
    - Which phase (if any) introduces persisted session storage? This is a prerequisite for any analytics, teacher review, or retry/resume features.

13. **Public read policy after migration**
    - The existing RLS for `question_sets` allows any unauthenticated user to read published sets (required for students entering via access code).
    - Does this policy remain unchanged after multi-admin RLS is added, or does access scope change?
    - Changing this without a matching read policy will silently break the student play entry flow.

14. **Application-layer auth approach** *(must decide before Phase 2)*
    - Which Supabase client helper pattern is used in Next.js route handlers: `createRouteHandlerClient`, `createServerActionClient`, or service role with explicit ownership checks?
    - Will a `middleware.ts` guard admin routes at the application layer (in addition to RLS at the DB layer)?

15. **GDPR compliance scope** *(mandatory, not optional — Finnish school platform)*
    - GDPR deletion and data portability obligations apply to any platform storing data about users in EU schools.
    - Which phase delivers: privacy policy, data retention limits, per-admin data export, and account deletion?
    - If student accounts are ever introduced, consent flows become required.

16. **Token and cost budget tracking**
    - Should per-user token usage and estimated cost be recorded?
    - Without this, there is no mechanism to enforce generation budgets, detect runaway usage, or produce usage reports per school.

17. **`question_flags` attribution**
    - The existing `question_flags` table has no `user_id` column; flags are anonymous.
    - With multi-admin, should flags be attributed to the flagging admin?

18. **Write route inventory completeness**
    - Before Phase 2 closes, the list of all write routes must be verified as exhaustive.
    - Who is responsible for confirming no route was missed? Missing even one route creates an ownership bypass.

## Known Gaps and Risks

The following gaps were identified during implementation review and must be addressed or explicitly deferred:

| Gap | Severity | Phase affected | Notes |
|-----|----------|----------------|-------|
| Pre-existing security issues (rate limiting, weak code RNG, missing CSP, RLS bug) | High | Phase 0 | Adding auth on top of these does not fix them; abuse surface increases with open signup |
| Student identity model absent | Medium | Phase 5 | Addressed: token-based pseudonymous profiles planned in section 7 / Phase 5 |
| Session/progress persistence absent | Medium | Analytics/Phase 4+ | No `game_sessions` table; all game state is in-memory |
| Public read policy conflict | High | Phase 1 | Existing anonymous read on published sets must be explicitly preserved in new RLS or student play breaks |
| Application-layer auth not specified | High | Phase 2 | Next.js middleware and client helper patterns must be decided before Phase 2 implementation |
| API key encryption approach unresolved | Medium | Phase 3 | Choose between Supabase Vault/KMS and libsodium before implementation starts |
| No token/cost tracking | Medium | Phase 3 | Required for per-user budgets; absence allows unlimited AI usage per account |
| GDPR compliance not phased | High | Unscheduled | Mandatory for Finnish school platform; currently treated as an open question rather than a delivery requirement |
| Write route inventory incomplete | High | Phase 2 | All write routes must be enumerated and verified before Phase 2 closes |
| Legacy backfill strategy undefined | High | Phase 1 | `NOT NULL` cannot be enforced until question 2 is answered |

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
4. User profiles (teacher display + student token identity) alongside or after session persistence.
5. Collaboration roles last (if needed).

This sequence minimizes risk while delivering immediate multi-admin safety.
