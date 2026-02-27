# Security Best Practices Report

## Executive Summary
The codebase has several strong foundations (Zod validation on many inputs, authenticated admin routes, and explicit file-type checks), but there are critical security gaps that should be prioritized immediately:

1. Secret material is present in local `.env` files and in `.env.example` values that look like real credentials.
2. Authorization is too coarse for destructive service-role write paths (authenticated users can trigger admin-power deletes/updates by resource ID).
3. Cookie-authenticated state-changing endpoints do not implement explicit CSRF defenses.

Addressing these first will materially reduce takeover, data-loss, and abuse risk.

## Scope and Method
- Stack reviewed: Next.js (App Router), TypeScript/React frontend, Supabase backend.
- Security guidance used: `security-best-practices` skill references for Next.js + React.
- Focus: secret handling, authn/authz, CSRF/CORS, headers/CSP, abuse resistance.

## Critical Findings

### SEC-001 (Critical): Real secrets present in repository-local env files and sample env
- Impact: Compromised keys can allow database compromise (service role), paid API abuse, and account takeover workflows.
- Locations:
  - `.env`: lines 1-3, 20
  - `.env.local`: lines 5, 9-10, 16
  - `.env.example`: lines 2-3, 6, 20
- Evidence:
  - API keys/tokens and service-role secrets are stored in plaintext env files.
  - `.env.example` contains credential-looking values instead of placeholders.
- Why this matters:
  - `.env.example` is tracked and likely copied to other environments; sample files must not carry live credentials.
  - Even if `.env`/`.env.local` are gitignored, plaintext credentials in workspaces/logs are high risk.
- Secure-by-default fix:
  1. Immediately rotate all exposed credentials (Supabase service role, Anthropic/OpenAI keys).
  2. Replace `.env.example` values with clear non-secret placeholders.
  3. Add/keep secret scanning in CI (e.g., Gitleaks/TruffleHog) and pre-commit hooks.
  4. Keep secrets only in deployment secret manager / CI env vars.

### SEC-002 (Critical): Broken authorization boundary on destructive service-role paths
- Impact: Any authenticated user can perform high-privilege destructive operations on arbitrary question sets when they know IDs (IDOR + privilege escalation).
- Locations:
  - [`src/app/api/delete-question-set/route.ts`](src/app/api/delete-question-set/route.ts):22, 56
  - [`src/app/api/questions/delete-by-topic/route.ts`](src/app/api/questions/delete-by-topic/route.ts):27, 52
  - [`src/lib/supabase/write-queries.ts`](src/lib/supabase/write-queries.ts):330-358, 382-430
  - [`src/app/api/question-sets/play/route.ts`](src/app/api/question-sets/play/route.ts):17, 35 (returns set rows including IDs)
- Evidence:
  - Routes require only `requireAuth()` then call service-role helpers that execute deletes/updates by `questionSetId` without ownership/admin checks.
  - Public/authenticated listing endpoints expose IDs needed to target these operations.
- Why this matters:
  - Service role bypasses RLS, so endpoint-level authorization must enforce ownership/role strictly.
- Secure-by-default fix:
  1. Enforce per-resource authorization before service-role writes.
  2. Add `created_by_user_id` (or equivalent owner column) if absent, and require:
     - owner OR admin for mutate/delete,
     - owner-only for user-scoped manage endpoints.
  3. In service-role write helpers, include owner predicate in the mutation query (not just pre-check):
     - e.g., `.eq('id', questionSetId).eq('created_by_user_id', user.id)` for non-admin.
  4. Add tests for horizontal privilege escalation (user A cannot mutate user B resources).

## High Findings

### SEC-003 (High): Missing CSRF protection on cookie-authenticated state-changing endpoints
- Impact: A victim’s browser can be tricked into executing authenticated state-changing requests from attacker-controlled pages.
- Locations (examples):
  - [`src/app/api/generate-questions/quiz/route.ts`](src/app/api/generate-questions/quiz/route.ts):21, 31
  - [`src/app/api/question-sets/submit/route.ts`](src/app/api/question-sets/submit/route.ts):22, 31
  - [`src/app/api/delete-question-set/route.ts`](src/app/api/delete-question-set/route.ts):14, 22
  - [`src/app/api/questions/delete-by-topic/route.ts`](src/app/api/questions/delete-by-topic/route.ts):20, 27
- Evidence:
  - Endpoints rely on cookie-based auth (`requireAuth`) but do not validate CSRF token and do not enforce strict `Origin/Referer` checks.
- Secure-by-default fix:
  1. Add centralized CSRF middleware for POST/PUT/PATCH/DELETE on cookie-auth APIs.
  2. Enforce strict same-origin `Origin` (and fallback `Referer`) allowlist.
  3. Add double-submit or synchronizer CSRF token for mutation endpoints.
  4. Keep session cookies `SameSite=Lax` or `Strict` in production.

### SEC-004 (High): CORS policy is overly permissive for credentialed APIs
- Impact: Broad cross-origin access with credentials increases risk of cross-origin abuse and misconfiguration-induced data exposure.
- Location:
  - [`src/proxy.ts`](src/proxy.ts):81, 99-103, 113-116
- Evidence:
  - Any `*.vercel.app` origin is accepted.
  - `Access-Control-Allow-Origin` reflects request origin and enables credentials.
  - OPTIONS can return `Access-Control-Allow-Origin: *` with credentials flag.
- Secure-by-default fix:
  1. Remove wildcard-style preview acceptance; use explicit environment-derived allowlist.
  2. Never combine `Allow-Credentials: true` with broad or dynamic untrusted origins.
  3. For APIs that do not need cross-origin browser access, disable CORS entirely (same-origin only).

### SEC-005 (High): CSP allows `'unsafe-inline'` and `'unsafe-eval'` globally
- Impact: XSS exploitability and post-XSS impact are significantly increased.
- Location:
  - [`next.config.js`](next.config.js):25-26
- Evidence:
  - `script-src` includes both `'unsafe-inline'` and `'unsafe-eval'`.
- Secure-by-default fix:
  1. Migrate inline script to nonce/hash-based policy.
  2. Remove `'unsafe-eval'` unless a hard dependency requires it (documented exception).
  3. Keep CSP tight per route if needed (e.g., analytics exceptions only where required).

## Medium Findings

### SEC-006 (Medium): Client-controlled `clientId` used as abuse-control identity in flag endpoint
- Impact: Rate limiting can be trivially bypassed by rotating `clientId`, enabling spam/abuse against moderation workflows.
- Location:
  - [`src/app/api/question-flags/route.ts`](src/app/api/question-flags/route.ts):14, 36, 44-45, 72
- Evidence:
  - Daily flag cap is keyed only by user-supplied `clientId` value.
- Secure-by-default fix:
  1. Bind limits to server-derived identity (IP/device fingerprint hash + optional auth user ID).
  2. Keep `clientId` as advisory metadata only, not authoritative throttle key.
  3. Add per-question/per-set anti-spam constraints in DB.

### SEC-007 (Medium): In-memory rate limiter is not robust in distributed/serverless production
- Impact: Attackers can bypass throttling across instances/restarts; expensive endpoints remain abuse-prone.
- Location:
  - [`src/lib/ratelimit.ts`](src/lib/ratelimit.ts):11, 54-57
- Evidence:
  - Rate-limit state stored in process memory (`Map`) only.
- Secure-by-default fix:
  1. Move to shared backend (Redis/Upstash) with atomic counters and TTL.
  2. Keep per-IP + per-user dimensions and enforce at edge + app layers.

## Recommended Remediation Order
1. Rotate all leaked secrets and sanitize `.env.example` (SEC-001).
2. Patch authz on all service-role write paths and add authorization tests (SEC-002).
3. Add CSRF defense and strict origin checks for mutating cookie-auth APIs (SEC-003).
4. Restrict CORS allowlist and remove broad preview-origin trust (SEC-004).
5. Tighten CSP by removing `unsafe-*` where possible (SEC-005).
6. Harden abuse controls for moderation + expensive endpoints (SEC-006, SEC-007).

## Notes
- Some protections may exist in infrastructure (CDN/WAF/platform) and are not visible in app code; validate runtime behavior in production.
