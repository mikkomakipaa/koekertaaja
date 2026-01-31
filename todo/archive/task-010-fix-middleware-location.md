# Task: Fix middleware location for CORS + rate limiting

## Context

- CORS and rate limiting live in `src/proxy.ts`, which Next.js does not treat as middleware.
- This means `/api/*` routes run without CORS enforcement or throttling.
- Related files: `src/proxy.ts`, `src/lib/ratelimit.ts`.

## Scope

- In scope:
  - Move middleware logic to a proper `src/middleware.ts` file.
  - Ensure the matcher continues to target `/api/:path*`.
  - Remove or repurpose `src/proxy.ts` to avoid dead code.
- Out of scope:
  - Changing CORS policy or rate-limit thresholds.

## Changes

- [ ] Create `src/middleware.ts` containing the existing logic from `src/proxy.ts`.
- [ ] Delete `src/proxy.ts` or leave a short comment file that re-exports to avoid confusion.
- [ ] Verify the middleware uses `NextResponse` and `NextRequest` as required by Next.js.

## Acceptance Criteria

- [ ] Requests to `/api/*` are subject to the CORS rules defined in middleware.
- [ ] Requests to `/api/generate-questions` are rate limited (HTTP 429 on exceed).
- [ ] No remaining references to `src/proxy.ts` in the codebase.

## Testing

- [ ] Manual: Call `/api/generate-questions` >5 times/hour and confirm 429 response.
- [ ] Manual: Verify a disallowed origin receives 403 for `/api/*`.
