# Task: Map question validation and tests

## Context

- Map questions introduce new schema, UI, and answer logic.
- Need automated coverage for schema validation and answer checking.

## Scope

- In scope:
  - Add tests for map schema validation.
  - Add tests for answer evaluation (correct/incorrect).
  - Add snapshot or UI tests if existing test setup supports it.
- Out of scope:
  - E2E tests unless current setup includes them.

## Changes

- [ ] Add unit tests for map question schema in `__tests__/` (follow `Documentation/TESTING_GUIDE.md`).
- [ ] Add unit tests for answer matching logic to include map type.
- [ ] Add fixtures for map questions.

## Acceptance Criteria

- [ ] Map questions are covered by unit tests.
- [ ] Tests fail on invalid map payloads.

## Testing

- [ ] `npm run test:unit` (or relevant command per `Documentation/TESTING_GUIDE.md`).
