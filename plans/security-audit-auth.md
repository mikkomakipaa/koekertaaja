# Security Audit: Authentication & User Management

**Scope**: Authentication layer, user management, API route authorization, and RLS policies  
**Date**: 2026-04-11  
**Auditor**: Claude Code (claude-sonnet-4-6)  
**Files reviewed**:
- `src/lib/supabase/auth.ts`
- `src/lib/supabase/server-auth.ts`
- `src/hooks/useAuth.ts`
- `src/lib/auth/admin.ts`
- `src/lib/security/csrf.ts`
- `src/lib/security/cors.ts`
- `src/proxy.ts`
- `src/app/api/question-sets/route.ts`
- `src/app/api/questions/[id]/route.ts`
- `src/app/api/generate-questions/quiz/route.ts`
- `src/app/api/delete-question-set/route.ts`
- `src/app/api/extend-question-set/route.ts`
- `src/app/api/question-flags/route.ts`
- `src/app/api/prompt-metrics/dashboard/route.ts`
- `supabase/migrations/20260411_add_question_sets_write_policies.sql`
- `supabase/migrations/20260411_add_school_members_and_classes.sql`

---

## Executive Summary

The authentication infrastructure is solid — CSRF protection, CORS allowlist, and server-side session validation via `getUser()` are all correctly implemented. However, there are **two high-severity vulnerabilities** that require fixes before multi-user admin rollout: (1) open self-registration exposes the auth system to unsolicited accounts, and (2) an API endpoint leaks all question sets to any authenticated user. Additionally, the current email-allowlist admin model is architecturally incompatible with the planned `app_metadata` role model, which must be resolved before any school admin accounts are created.

---

## CRITICAL — Fix immediately

### C1 — `getCreatedQuestionSets()` leaks all content to any authenticated user

**File**: `src/app/api/question-sets/route.ts:128–175`  
**Impact**: Any user who signs in (even with a freshly created account) can call `GET /api/question-sets?scope=created` and receive all 200 question sets from all schools, including unpublished drafts.

The function calls `requireAuth()` (any authenticated user) but then queries with `getSupabaseAdmin()` — bypassing RLS — with no `user_id` filter:

```typescript
// line 132-133
await requireAuth();  // ← not requireAdmin

const supabaseAdmin = getSupabaseAdmin();  // ← bypasses RLS
// no .eq('user_id', user.id) filter anywhere below
```

**Fix**: Either call `requireAdmin()` (for super-admin-only use) or filter by `user_id = user.id` for regular admins. For the multi-user model, school admins should only see their own sets — change to `requireAuth()` + filter by `user_id`.

---

### C2 — `school_id` accepted from request body in generate-questions route

**File**: `src/app/api/generate-questions/quiz/route.ts:117`  
**Impact**: Any authenticated admin can create content under any school by supplying an arbitrary `school_id` in the form data. Per plan-180 AD1, `school_id` must be derived server-side from `auth.uid() → school_members` exclusively — never from the request body.

```typescript
school_id: formData.get('school_id') as string,  // ← from client request body
```

This is not a live risk today (single admin, no school members table in use), but **must be fixed before any second school admin account is provisioned**. The fix is specified in plan-180 Step 4.

---

## HIGH — Fix before multi-user rollout

### H1 — `signUp()` exposed in `useAuth` — open self-registration

**File**: `src/hooks/useAuth.ts:65–81`  
**Impact**: `signUp` is exported and callable by anyone on the login page or via browser console. For a controlled-access platform (5–10 pilot schools, admin provisioned manually), this creates an attack surface: outsiders can register accounts.

```typescript
// line 98-102
return {
  ...state,
  signIn,
  signUp,  // ← should be removed
  signOut,
};
```

**Fixes**:
1. Remove `signUp` from `useAuth` return value and function body.
2. Disable signups at the Supabase project level: Dashboard → Authentication → Settings → "Disable sign-ups". This is the hard guard; removing from `useAuth` is defense in depth.

---

### H2 — Admin model mismatch: email allowlist vs. `app_metadata` roles

**File**: `src/lib/auth/admin.ts`  
**Impact**: The current admin gate (`isAdmin(email)`) checks `ADMIN_EMAILS` env var. The multi-user plan mandates `app_metadata.role = 'super_admin'` (plan-180, AD2). These are incompatible — school admins created via Supabase Admin API will not be recognized by `isAdmin()`, and privilege escalation logic that reads `app_metadata` (as specified in plan-180 RLS policies) won't work with the current `requireAdmin()` implementation.

All API routes that call `requireAdmin()` — question set publish/unpublish, question edit/delete, flag management — will silently block any new school admins from writing, even after their accounts are created in Supabase.

**Fix**: Migrate `requireAdmin()` / `isAdmin()` to check `user.app_metadata?.role === 'super_admin'` (for super admin) and create a separate `requireSchoolAdmin()` that checks `school_members`. This is partially designed in plan-180 Step 2 (`src/lib/auth/roles.ts`).

---

### H3 — `/admin/*` routes unprotected in proxy

**File**: `src/proxy.ts:16–18`  
**Impact**: The proxy only protects `/create` and `/create/*`. When the `/admin/*` pages from plan-180 are built, they will be publicly accessible unless the proxy is updated. An unauthenticated visitor who guesses the URL would reach the React shell; server actions/API routes would still reject them, but they'd see admin UI.

```typescript
const PROTECTED_PATHS = ['/create', '/create/'];
// /admin/* not included
```

**Fix**: Add `/admin` and `/admin/` to `PROTECTED_PATHS` in `proxy.ts` before any admin UI pages are deployed.

---

## MEDIUM

### M1 — CSRF skipped for `getCreatedQuestionSets`

**File**: `src/app/api/question-sets/route.ts:130`  
**Details**: `requireAuth()` is called without `request`, so `requireCsrfRequest()` is skipped. This endpoint is GET-only (read-only), so there's no state mutation risk, but the admin client bypass in C1 above makes this worth noting.

Once C1 is fixed (filter by `user_id`), CSRF on a read endpoint is low risk and this can be left as-is.

---

### M2 — `useAuth` initializes from `getSession()` (local JWT, not server-validated)

**File**: `src/hooks/useAuth.ts:29`  
**Details**: The initial auth state is populated from `getSession()`, which reads the locally stored JWT without calling the Supabase auth server. This is standard for client UI state and Supabase explicitly recommends this pattern for the browser hook. Server-side operations correctly use `getUser()` (server-validated). No action needed, documented for clarity.

---

### M3 — `school_members` migration still allows `teacher` role

**File**: `supabase/migrations/20260411_add_school_members_and_classes.sql:6`  
**Details**: `CHECK (role IN ('admin', 'teacher'))` — the teacher role is retired per plan-180. This is a schema-level inconsistency; no code path creates teacher rows today, but the constraint permits it.

**Fix**: Add to the plan-180 migrations: `ALTER TABLE school_members DROP CONSTRAINT IF EXISTS ...; ALTER TABLE school_members ADD CONSTRAINT ... CHECK (role IN ('admin'));`

---

### M4 — `prompt-metrics/dashboard` uses email-allowlist admin check

**File**: `src/app/api/prompt-metrics/dashboard/route.ts:37`  
**Details**: `isAdmin(user.email)` gates whether all metrics are shown vs. just the user's own. Same root issue as H2 — will break when admin model migrates to `app_metadata`.

---

## LOW

### L1 — `getPlayableQuestionSets` isAdmin check gates draft visibility

**File**: `src/app/api/question-sets/route.ts:187`  
**Details**: Admin users (email-allowlist) bypass the `status = 'published'` filter. Correct behavior, but depends on H2's admin model fix.

### L2 — No rate limiting on login endpoint

**File**: `src/app/login/page.tsx` / Supabase auth  
**Details**: Login attempts are not rate-limited at the application layer. Supabase has built-in rate limiting on auth endpoints (5 attempts per hour per email by default), which provides adequate protection for a controlled-access pilot.

---

## What Is Working Well

- `getServerUser()` in `server-auth.ts` correctly uses `getUser()` (server-validates the JWT with Supabase), not `getSession()`. This is the right pattern.
- CSRF double-submit cookie implementation is correct — origin/referer check + cookie/header token comparison.
- CORS origin allowlist is correctly implemented.
- All mutation API routes check authentication server-side (they do not rely solely on the proxy).
- Input validation with Zod is used consistently across all mutation routes.
- Structured logging (pino) is in place; error responses are sanitized in production.
- `question-flags` POST has per-user + per-question rate limiting via `client_id` (IP+userId composite).
- `school_members` RLS correctly scopes reads to the authenticated user's own rows.
- `question_sets` RLS migration (`20260411_add_question_sets_write_policies.sql`) correctly scopes INSERT/UPDATE to `auth.uid() = user_id`.

---

## Summary Table

| ID | Severity | Description | Fix location |
|----|----------|-------------|--------------|
| C1 | Critical | `getCreatedQuestionSets` leaks all content to any authenticated user | `src/app/api/question-sets/route.ts:128` |
| C2 | Critical | `school_id` from request body violates BYOK key isolation | `src/app/api/generate-questions/quiz/route.ts:117` |
| H1 | High | `signUp()` exposed — open self-registration | `src/hooks/useAuth.ts:65` + Supabase Dashboard |
| H2 | High | Admin model mismatch: email allowlist vs `app_metadata` roles | `src/lib/auth/admin.ts` + plan-180 Step 2 |
| H3 | High | `/admin/*` routes not protected in proxy | `src/proxy.ts` |
| M1 | Medium | CSRF skipped on `getCreatedQuestionSets` (GET/read-only) | `src/app/api/question-sets/route.ts:130` |
| M2 | Medium | `useAuth` uses `getSession()` — expected, no action needed | — |
| M3 | Medium | `school_members` still allows `teacher` role constraint | `supabase/migrations/` (new migration) |
| M4 | Medium | `prompt-metrics` admin check via email allowlist | `src/app/api/prompt-metrics/dashboard/route.ts:37` |
| L1 | Low | Draft visibility gate depends on email-allowlist (tied to H2) | Resolved by H2 fix |
| L2 | Low | No app-level login rate limiting (Supabase default covers this) | — |

---

## Recommended Fix Order

1. **C1** — Fix immediately: add `user_id` filter to `getCreatedQuestionSets` or require admin
2. **H1** — Disable sign-ups in Supabase Dashboard + remove `signUp` from `useAuth`
3. **H2** — Migrate admin check to `app_metadata.role` (prerequisite for plan-180)
4. **H3** — Add `/admin` to proxy protected paths (before deploying admin UI)
5. **C2** — Fix before provisioning any second school (derive `school_id` server-side)
6. **M3** — Add to plan-180 migrations: restrict `school_members.role` to `admin` only
