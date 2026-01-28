# Task: Add question flag storage schema

## Context

- Anonymous pupils can flag wrong questions after submitting answers.
- Need Supabase persistence to support admin review and rate limiting.
- No IP storage allowed.
- Related files:
  - supabase/migrations/
  - src/types/
  - docs/PUBLISHING_WORKFLOW.md (reference for status-related workflows)

## Scope

- In scope:
  - Add Supabase schema for question flags.
  - Add enum for flag reasons.
  - Add indexes for lookups by question and by client id/date.
  - Update TypeScript DB types if applicable.
- Out of scope:
  - API route or UI changes.

## Changes

- [ ] Add migration to create `question_flags` table with:
  - id (uuid, pk)
  - question_id (uuid, fk -> questions.id, cascade delete)
  - question_set_id (uuid, fk -> question_sets.id, cascade delete)
  - reason (enum: wrong_answer, ambiguous, typo, other)
  - note (text, nullable)
  - client_id (text, required, anonymized localStorage token)
  - created_at (timestamptz default now)
- [ ] Add indexes:
  - (question_id)
  - (question_set_id)
  - (client_id, created_at desc)
- [ ] Update Supabase generated types if this repo stores them manually.

## Acceptance Criteria

- [ ] Migration exists and is idempotent.
- [ ] Table supports enforcing “3 flags per 24h per client_id” in queries.
- [ ] No IP address field is stored.

## Testing

- [ ] Manual: confirm migration applies on local dev DB.
- [ ] Optional: run `npm run typecheck` if types were updated.
