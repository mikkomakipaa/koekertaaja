# Plan: Multi-User Admin Platform

**Status**: Decisions locked — ready for task creation  
**Builds on**: `plan-179-school-selection.md` (school schema in place)  
**Date**: 2026-04-11  
**Revised**: 2026-04-11 (dropped super_admin app role; API key onboarding wizard; write-only key constraint; self-service sign-up with registration token)

---

## Goals

1. Allow school admins to log in and create question sets scoped strictly to their school
2. Each school brings their own API key (BYOK) — no platform AI cost, no key mixing between schools
3. School admins self-register via a token-gated sign-up page — one form creates account, school, and stores API key
4. Use Supabase user management for all admin credentials

---

## Decisions (Locked)

| # | Decision |
|---|----------|
| Pilot size | 5–10 schools — token-gated self-service sign-up, no manual dashboard provisioning needed |
| BYOK | Strict — no platform fallback key. If school has no key set, creation is blocked with a clear error |
| Key isolation | App must never use one school's API key for another school's content. Key derived server-side from `auth.uid()` only, never from request body |
| Key visibility | Write-only. Once stored in Vault, the key is never returned to any client — not to the admin, not to Mikko. No reveal endpoint exists anywhere in the app |
| Role model | One app role: school `admin`. No `super_admin` role in the app. Mikko operates via Supabase Dashboard service role |
| Provisioning | Token-gated `/signup` page — admin fills in school info, user data, and API key in one form. `ADMIN_SIGNUP_TOKEN` env var acts as the gate; Mikko shares token out-of-band |
| Sign-up atomicity | Single API route creates auth user + school + school_members + vault key. Rolls back (deletes user + school) if any step fails |
| Post-signup | Auto-login after successful registration → redirect to `/create` |
| Key rotation | `/setup` page for existing admins to delete + re-enter their API key |
| Cost limits | Defined by admin on their AI platform (Anthropic/OpenAI account limits). App does not enforce them |

---

## What Is Already Done

| Item | Status |
|------|--------|
| `schools` table | Done |
| `school_members` table (stub) | Done — needs data + RLS upgrade |
| `classes` table (stub) | Done (unused in Phase A) |
| `school_id` / `class_id` on `question_sets` | Done |
| `user_id` on `question_sets` | Done |
| `prompt_metrics` with `user_id` + cost tracking | Done |
| Supabase email/password auth + `useAuth` hook | Done |
| Login page + redirect flow | Done |
| `/create` route protected by proxy | Done |

---

## Role Model

### `admin` (school_members.role)
- One `school_members` row linking them to their school
- Can: create/edit/publish question sets for their school, set their school's API key
- Cannot: see or touch any other school's data (enforced by RLS)
- UI: standard `/create` flow with onboarding wizard on first login

### Platform administration (Mikko)
- Shares `ADMIN_SIGNUP_TOKEN` out-of-band with each new school
- Can inspect data, fix issues, and manage accounts via Supabase Dashboard (service role)
- No app UI needed for pilot

No teacher role — retired.  
No `super_admin` app role — deferred to commercial phase if a management UI becomes necessary.

---

## Architecture Decisions

### AD1 — Strict BYOK key isolation + write-only constraint

Each school's API key is stored in Supabase Vault. The key used for any generation run is derived **exclusively** from the requesting user's school membership:

```
auth.uid()
  → school_members (lookup school_id)
  → school_settings (lookup vault_secret_id for provider)
  → vault.decrypt(secret_id) → raw key (server-side only, never logged)
  → provider router uses this key for the call
  → prompt_metrics row records user_id + school_id
```

Key visibility constraints (hard rules, no exceptions):
- `POST /api/school/api-key` — accepts key, stores to Vault, returns `{ keySet: true }` only. Never echoes the key back.
- `DELETE /api/school/api-key` — removes Vault secret + clears secret ID. No read path.
- No "show key" or "export key" endpoint exists anywhere in the app.
- `school_settings` stores only the Vault secret UUID (opaque reference) — readable by the school admin to determine "is a key set", meaningless without service role Vault access.
- `getApiKeyForSchool()` is called exclusively server-side during generation; the decrypted key never appears in a response body.

If no key is found for the school: **block with error, no fallback**. Mixing keys between schools is a hard architectural constraint, not a configuration option.

### AD2 — Token-gated self-service sign-up

School admins register themselves via `/signup`. A shared registration token (`ADMIN_SIGNUP_TOKEN` env var) prevents open registration. The single form collects everything needed to fully provision the account:

**Form fields:**
- Registration code (validated against `ADMIN_SIGNUP_TOKEN`)
- Name
- Email
- Password + confirm password
- School name
- Municipality
- AI provider (Anthropic / OpenAI)
- API key (password input — never shown after submission)

**Server action (`POST /api/admin/signup`):**
```
1. Validate registration token → 401 if wrong
2. Validate all inputs with Zod
3. supabaseAdmin.auth.admin.createUser({ email, password, user_metadata: { name } })
   → bypasses "Disable sign-ups" setting (admin API)
4. INSERT INTO schools (name, municipality) → get school_id
5. INSERT INTO school_members (user_id, school_id, role='admin')
6. vault.secrets INSERT (api_key) → get vault_secret_id
7. INSERT INTO school_settings (school_id, <provider>_key_secret_id)
8. On any failure from step 4 onwards: delete auth user + rollback
9. Return { success: true }
```

**After success:** client calls `signInWithPassword` then redirects to `/create`.

### AD3 — RLS upgrade: school_members-scoped

Current write policies (service_role only) replaced with membership-scoped policies. This enforces isolation at the DB layer as a second line of defence after the application layer.

### AD4 — Supabase Vault for key storage

Keys never appear in plaintext in the database. `school_settings` stores only the Vault secret reference ID. All decryption happens server-side via service role, exclusively during question generation.

### AD5 — API key management page (`/setup`)

New admins provide their API key during sign-up (AD2), so `/setup` is primarily for **key rotation** — deleting the existing key and entering a new one. It also serves as a fallback if a returning admin somehow has no key set.

Behaviour:
- Accessible to any authenticated school admin
- Shows current key status per provider (boolean — never the key value)
- "Poista avain" → DELETE `/api/school/api-key` → clears vault secret
- After deletion (or if no key set): shows provider + key input → POST `/api/school/api-key`
- On save: redirect to `/create`

There is no way to view the stored key at any point. Rotation = delete + re-enter.

---

## Database Changes

### New table: `school_settings`

```sql
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE UNIQUE NOT NULL,
  anthropic_key_secret_id UUID,   -- vault.secrets reference, NULL = not set
  openai_key_secret_id UUID,      -- vault.secrets reference, NULL = not set
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;

-- School admin can read their own settings (boolean key-set status only)
CREATE POLICY "school_settings_member_read" ON school_settings
  FOR SELECT USING (
    school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid())
  );

-- Service role only for writes (key management must go via server-side API route)
CREATE POLICY "school_settings_service_write" ON school_settings
  FOR ALL USING (auth.role() = 'service_role');
```

### Add `school_id` to `prompt_metrics`

```sql
ALTER TABLE prompt_metrics
  ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX idx_prompt_metrics_school ON prompt_metrics(school_id);
```

### RLS upgrade on `question_sets`

**Administration scope: creator (user_id), not school.**  
Admins manage only the sets they personally created.  
School scoping remains on INSERT only — ensures new sets land in the right school for student browse.

```sql
-- Remove phase 1 service_role write policies
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON question_sets;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON question_sets;

-- INSERT: school_id must match the admin's school membership (student browse integrity)
CREATE POLICY "creator_insert" ON question_sets
  FOR INSERT WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_members WHERE user_id = auth.uid()
    )
  );

-- UPDATE: creator owns their sets
CREATE POLICY "creator_update" ON question_sets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: creator owns their sets
CREATE POLICY "creator_delete" ON question_sets
  FOR DELETE USING (user_id = auth.uid());
```

**Consequence**: The existing create page management view already filters by `user_id` — no UI changes needed for content scoping.

### Fix `school_members` role constraint

Remove the `teacher` role option — it was retired before any data was written:

```sql
ALTER TABLE school_members
  DROP CONSTRAINT IF EXISTS school_members_role_check;

ALTER TABLE school_members
  ADD CONSTRAINT school_members_role_check CHECK (role IN ('admin'));
```

---

## Implementation Checklist

### Step 1 — Remove public signUp exposure
- [ ] Remove `signUp()` function from `src/hooks/useAuth.ts`
- [ ] Remove `signUp` from `useAuth` return value
- [ ] Disable sign-ups in Supabase Dashboard: Authentication → Settings → "Disable sign-ups"
  - Note: our `/api/admin/signup` uses `supabaseAdmin.auth.admin.createUser()` which bypasses this — intentional

### Step 2 — Admin role helper
- [ ] Create `src/lib/auth/roles.ts`
  - `getSchoolForUser(userId): Promise<SchoolMember | null>` — reads `school_members`
  - `requireSchoolMember(userId): Promise<SchoolMember>` — throws if no membership

### Step 3 — Admin sign-up page
- [ ] Add `ADMIN_SIGNUP_TOKEN` to `.env.local` and Vercel environment variables
- [ ] Create `src/app/api/admin/signup/route.ts` — `POST` handler
  - Validate registration token against `ADMIN_SIGNUP_TOKEN` env var → 401 if wrong
  - Zod validation of all fields (name, email, password, school name, municipality, provider, api key)
  - `supabaseAdmin.auth.admin.createUser({ email, password, user_metadata: { name } })`
  - INSERT `schools` row → capture `school_id`
  - INSERT `school_members` row (user_id, school_id, role='admin')
  - Store API key in Vault → get `vault_secret_id`
  - INSERT `school_settings` (school_id, `<provider>_key_secret_id`)
  - On failure after user creation: delete auth user + any created rows (rollback)
  - Return `{ success: true }` — never echo the API key
- [ ] Create `src/app/signup/page.tsx`
  - Public page (no auth required — user doesn't have an account yet)
  - Form: registration code, name, email, password, confirm password, school name, municipality, provider selector, API key (password input)
  - On submit: POST to `/api/admin/signup` → on success: `signInWithPassword` → redirect to `/create`
  - Add link to `/signup` from the login page ("Rekisteröidy")
  - Add `/signup` to proxy matcher exclusions (must remain publicly accessible)

### Step 4 — Migrations
- [ ] `supabase/migrations/20260411_add_school_settings.sql`
- [ ] `supabase/migrations/20260411_add_school_id_to_prompt_metrics.sql`
- [ ] `supabase/migrations/20260411_upgrade_question_sets_rls_to_school_members.sql`
- [ ] `supabase/migrations/20260411_fix_school_members_role_constraint.sql`

### Step 5 — BYOK key management
- [ ] Create `src/app/api/school/api-key/route.ts`
  - `POST`: validate key format → store in `vault.secrets` via service role → upsert secret ID in `school_settings` → return `{ keySet: true }` only (never echo the key)
  - `DELETE`: remove vault secret + clear secret ID from `school_settings`
  - Auth: only callable by school admin for their own school (verified server-side via `school_members`)
  - No GET handler — no read path for the key exists
- [ ] Create `src/lib/ai/getApiKeyForSchool.ts`
  - `getApiKeyForSchool(schoolId, provider): Promise<string>` — reads vault secret server-side
  - Throws if no key set (no fallback — hard constraint)
- [ ] Update `src/app/api/generate-questions/quiz/route.ts` and `flashcard/route.ts`
  - Derive `school_id` from `auth.uid()` → `school_members` (remove `school_id` from FormData parsing)
  - Call `getApiKeyForSchool` — block with Finnish error if missing: `"API-avainta ei ole asetettu. Lisää avain koulun asetuksissa."`
  - Pass key to provider router
  - Write `school_id` to `prompt_metrics` row
- [ ] Update `src/app/api/extend-question-set` similarly (derive school_id server-side)

### Step 6 — API key management page (`/setup`)
- [ ] Create `src/app/setup/page.tsx` — key rotation + fallback setup
  - Protected: requires auth + `school_members` row
  - Create `src/components/admin/ApiKeyStatus.tsx`
    - Shows boolean status per provider: "Anthropic: asetettu ✓" / "ei asetettu"
    - "Poista avain" button → DELETE `/api/school/api-key`
    - After delete (or if no key): shows provider selector + password-type key input → POST `/api/school/api-key`
    - No "show key" or "copy key" affordance anywhere
  - On key saved: redirect to `/create`
- [ ] Page-level guard on `/create`:
  - If `school_members` row exists but no key in `school_settings` → redirect to `/setup`
  - If no `school_members` row → show error block (account not linked to a school — contact admin)

### Step 7 — Create form: auto-assign school
- [ ] Update `src/app/create/page.tsx`
  - Remove school selector dropdown (school derived from membership)
  - Add `ApiKeyStatus` component (admin-only, shown when authenticated)
  - If user has no `school_members` row → show error, block creation
  - If user belongs to multiple schools (edge case) → show school selector

### Step 8 — Fix getCreatedQuestionSets data leak (security audit C1)
- [ ] Update `src/app/api/question-sets/route.ts:getCreatedQuestionSets()`
  - After `requireAuth()`, get `user.id`
  - Change query to filter `.eq('user_id', user.id)` instead of returning all sets via admin client

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/lib/auth/roles.ts` | `getSchoolForUser(userId)`, `requireSchoolMember(userId)` |
| `src/lib/ai/getApiKeyForSchool.ts` | Vault key resolver — strict BYOK, no fallback, server-side only |
| `src/app/api/admin/signup/route.ts` | Token-gated sign-up: creates user + school + school_members + vault key atomically |
| `src/app/api/school/api-key/route.ts` | BYOK key set/delete endpoint — write-only, no GET |
| `src/app/signup/page.tsx` | Self-service admin registration form |
| `src/app/setup/page.tsx` | API key rotation page for existing admins |
| `src/components/admin/ApiKeyStatus.tsx` | Boolean key status display + delete trigger |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/hooks/useAuth.ts` | Remove `signUp` export |
| `src/app/create/page.tsx` | Auto-assign school from membership; add ApiKeyStatus; gate on key presence |
| `src/app/api/generate-questions/quiz/route.ts` | Derive school_id server-side; BYOK key routing; write school_id to prompt_metrics |
| `src/app/api/generate-questions/flashcard/route.ts` | Same as quiz route |
| `src/app/api/extend-question-set/` (handler) | Derive school_id server-side |
| `src/app/api/question-sets/route.ts` | Fix getCreatedQuestionSets to filter by user_id (C1) |
| `src/types/index.ts` | Add `SchoolSettings` type |

---

## Out of Scope (This Plan)
- Super admin app UI (deferred — Supabase Dashboard sufficient for pilot)
- Teacher role
- Class selection for students (schema exists, UI deferred)
- Email verification flow (Supabase default behaviour — can be enabled when needed)
- Stripe billing / subscription management
- Google Classroom integration
- Student accounts or progress persistence

## Phase B Triggers (Commercial)
When ready to charge: add `billing_model` + `subscription_active` to `school_settings`, integrate Stripe Customer per school, aggregate `prompt_metrics.estimated_cost_usd` by school for invoicing. BYOK option remains available as a tier. Super admin app UI may be warranted at this scale.
