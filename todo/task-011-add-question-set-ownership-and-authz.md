# Task: Add question set ownership and enforce authz on mutations

## Context

- Mutating routes (`delete-question-set`, `extend-question-set`, `question-sets/submit`, `generate-questions`) only check authentication, not ownership.
- Any authenticated user can delete or extend any question set if they know its `id`.
- We need ownership metadata to enforce access rules for destructive actions.

## Scope

- In scope:
  - Add an owner field (e.g., `created_by`) to `question_sets`.
  - Set ownership when creating question sets.
  - Enforce ownership checks in delete/extend routes.
  - Update related types and documentation.
- Out of scope:
  - Building a full user management UI.
  - Changing public read access for question sets.

## Changes

- [ ] Add a Supabase migration to add `created_by` (UUID) to `question_sets`.
- [ ] Update write paths to set `created_by` from `requireAuth()` user id.
- [ ] Update `src/lib/supabase/write-queries.ts` to accept/set ownership.
- [ ] Update `src/types/database.ts` and any derived types to include `created_by`.
- [ ] Enforce ownership in:
  - [ ] `src/app/api/delete-question-set/route.ts`
  - [ ] `src/app/api/extend-question-set/route.ts`
- [ ] Document the ownership/authz rule in `DWF/adr/ADR-001-core-architecture.md`.

## Acceptance Criteria

- [ ] Question sets created via API include `created_by`.
- [ ] Delete/extend return 403 when `created_by` does not match authenticated user.
- [ ] Legacy question sets without `created_by` are handled explicitly (documented and enforced behavior).
- [ ] Documentation reflects the ownership rule and rationale.

## Testing

- [ ] Unit/API: Create a question set and verify `created_by` is set.
- [ ] Unit/API: Attempt delete/extend as a different user and verify 403.
- [ ] Unit/API: Attempt delete/extend as owner and verify success.
