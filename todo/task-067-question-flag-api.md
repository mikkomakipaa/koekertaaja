# Task: Add API for anonymous question flagging with rate limit

## Context

- Pupils (anonymous) can flag a question after submitting an answer.
- Rate limit: 3 flags per 24h per client.
- No IP storage; use client_id from localStorage.
- Related files:
  - src/app/api/
  - src/lib/supabase/admin.ts
  - src/lib/supabase/server-auth.ts (do NOT use for anon endpoint)
  - src/lib/logger

## Scope

- In scope:
  - Add POST endpoint to submit a flag.
  - Validate payload with Zod.
  - Enforce rate limit per client_id over rolling 24h.
  - Store flag in Supabase with admin client (server-side write).
- Out of scope:
  - UI changes.

## Changes

- [ ] Add `POST /api/question-flags`:
  - Body: { questionId, questionSetId, reason, note?, clientId }
  - Validate reason enum and UUIDs.
  - Reject missing/invalid clientId.
- [ ] Rate limit query: count flags where client_id = X and created_at >= now()-24h; reject if >= 3.
- [ ] Insert flag row and return success.
- [ ] Consistent error responses: `{ error: string, details?: unknown }`.

## Acceptance Criteria

- [ ] Anonymous requests can create a flag with valid payload.
- [ ] Fourth flag within 24h returns 429 with a clear error message.
- [ ] Invalid payload returns 400.

## Testing

- [ ] Add API tests if a pattern exists, otherwise manual curl test.
- [ ] Manual: verify 3-per-24h behavior with repeated calls.
