# Task: Fix question-type schema tests delete errors

## Context

- `tests/question-type-schema.test.ts` uses `delete` on non-optional fields, causing TS2790.

## Scope

- In scope:
  - Adjust test data cloning to satisfy TS (e.g., use `const fixture: any` or omit fields via destructuring).
- Out of scope:
  - Changing test intent or coverage.

## Changes

- [ ] Update tests to remove fields without using `delete` on non-optional properties.
- [ ] Keep test semantics intact (invalid payloads should still be invalid).

## Acceptance Criteria

- [ ] `npm run typecheck` passes.
- [ ] Tests still validate missing-field cases.

## Testing

- [ ] Run `scripts/test.sh`.
