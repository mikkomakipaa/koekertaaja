# Task: Fix TypeScript types in write-queries update call

## Context

- `src/lib/supabase/write-queries.ts` has `never` errors on update.
- Update payload typing needs alignment with Supabase types.

## Scope

- In scope:
  - Fix the update call typing (use explicit generic or cast to `Database['public']['Tables']['question_sets']['Update']`).
- Out of scope:
  - Behavior changes.

## Changes

- [ ] Update update call typing to satisfy TypeScript without `any`.

## Acceptance Criteria

- [ ] `npm run typecheck` passes for this file.

## Testing

- [ ] Run `npm run typecheck`.
