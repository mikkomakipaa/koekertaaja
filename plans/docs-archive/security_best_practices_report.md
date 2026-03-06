# Security Best Practices Review (Post-Fix)

Date: 2026-02-27
Reviewer: Codex (`security-best-practices` skill)
Scope: Next.js + TypeScript + Supabase server/client paths under `src/app/api`, `src/lib/security`, `src/lib/supabase`, and auth-related frontend routing.

## Executive Summary

A new post-fix review found that earlier critical areas (notably CSRF enforcement on authenticated mutating routes and ownership checks in delete flows) are improved, but **two high-impact authorization issues remain**:

1. **Critical**: Any authenticated user can extend any question set by ID via a service-role write path.
2. **High**: Any authenticated user can read the global unpublished/created question set inventory.

There is also one **medium** browser-hardening gap in CSP (`unsafe-inline`) that increases impact if any XSS primitive is introduced.

---

## Critical Findings

### SEC-001 (Critical): Missing ownership/role authorization in `extend-question-set` service-role mutation path

- Rule ID: `NEXT-AUTHZ-001`
- Severity: Critical
- Location:
  - `src/lib/api/extendQuestionSet.ts:48`
  - `src/lib/api/extendQuestionSet.ts:96`
  - `src/lib/api/extendQuestionSet.ts:235`
  - `src/lib/api/extendQuestionSet.ts:268`
- Evidence:
  - Endpoint only requires authentication (`requireAuthFn`) and stores `userId`, but does not verify the target `questionSetId` belongs to that user (or admin).
  - `existingSet` is loaded by ID without actor binding, then writes are performed with `getSupabaseAdmin()`.
- Impact:
  - Any logged-in non-admin account can append AI-generated questions to another user's/admin's set if they can obtain a set ID.
  - This is a direct integrity violation on privileged service-role writes.
- Fix:
  - Enforce explicit authorization before mutation:
    - Require `actor = toWriteActorContext(user)`.
    - Fetch `question_sets.id,user_id` by ID via admin client and reject unless `actor.isAdmin || set.user_id === actor.userId`.
  - Prefer moving this flow into `src/lib/supabase/write-queries.ts` with the same actor-guard model used by delete handlers.
- Mitigation:
  - Add integration tests for cross-user extension attempts (`403` expected).
- False positive notes:
  - None; authorization check is absent in the handler path.

---

## High Findings

### SEC-002 (High): Over-broad data access in `/api/question-sets/created`

- Rule ID: `NEXT-AUTHZ-002`
- Severity: High
- Location:
  - `src/app/api/question-sets/created/route.ts:8`
  - `src/app/api/question-sets/created/route.ts:10`
  - `src/app/api/question-sets/created/route.ts:13`
- Evidence:
  - Route uses `requireAuth()` (not `requireAdmin()`), then queries all `question_sets` via `getSupabaseAdmin()` with no `user_id`/role scoping.
- Impact:
  - Any authenticated account can enumerate all created question sets and associated per-set distributions, exposing non-public study content metadata.
- Fix:
  - If this is an admin-only management endpoint: switch to `requireAdmin(request)`.
  - If non-admin access is intended: scope results by `user_id = authenticatedUser.id`.
- Mitigation:
  - Add regression tests:
    - non-admin receives `403` (admin-only model), or
    - non-admin sees only own rows (owner-scoped model).
- False positive notes:
  - If Supabase Auth signups are fully closed and only admin users can authenticate, exploitability is reduced; still a policy/defense gap.

---

## Medium Findings

### SEC-003 (Medium): CSP allows inline script/style (`unsafe-inline`)

- Rule ID: `NEXT-CSP-001`
- Severity: Medium
- Location:
  - `src/lib/security/csp.ts:4`
  - `src/lib/security/csp.ts:5`
  - `src/app/layout.tsx:52`
- Evidence:
  - CSP includes `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'`.
  - App injects an inline `<script>` block in layout head.
- Impact:
  - If any script injection path appears, CSP will provide weaker containment than nonce/hash-based policies.
- Fix:
  - Replace inline script with nonce-based script policy, or remove inline script and use a non-inline initialization strategy.
  - Remove `unsafe-inline` from `script-src`; keep `style-src` strict where feasible.
- Mitigation:
  - Add CSP report-only rollout before enforcing stricter policy.
- False positive notes:
  - Current inline script is static and not attacker-controlled; this is a hardening issue, not proof of active XSS.

---

## Verified Improvements Since Previous Review

- CSRF protections are present for authenticated mutating routes via `requireAuth(request)` and CSRF validation in `validateCsrfRequest`:
  - `src/lib/supabase/server-auth.ts:112`
  - `src/lib/security/csrf.ts:11`
  - `src/lib/security/csrf-core.ts:48`
- Ownership-aware delete logic is implemented in write queries:
  - `src/lib/supabase/write-queries.ts:418`
  - `src/lib/supabase/write-queries.ts:478`
- Draft access by code is admin-gated when `includeDrafts=1`:
  - `src/app/api/question-sets/by-code/route.ts:25`

## Recommended Remediation Order

1. Fix `SEC-001` immediately (critical integrity risk on service-role writes).
2. Fix `SEC-002` next (data exposure via over-broad admin-client read).
3. Harden CSP per `SEC-003` as defense in depth.
