# Task: Fix TypeScript types in publish API route

## Context

- `src/app/api/question-sets/publish/route.ts` fails typecheck with `never` types.
- Likely due to Supabase typing inference in `update().select().single()`.

## Scope

- In scope:
  - Fix typings in publish route (use explicit generics or typed cast for update/select results).
  - Preserve existing behavior and error handling.
- Out of scope:
  - Refactoring other API routes.

## Changes

- [ ] Update Supabase update call to use typed generic or explicit `QuestionSet` typing.
- [ ] Ensure `data` is typed so property access is valid.

## Acceptance Criteria

- [ ] `npm run typecheck` passes for this file.
- [ ] Behavior unchanged (still updates status).

## Testing

- [ ] Run `npm run typecheck`.
