# Task: Add fixtures for all question types

## Context

- Need deterministic fixtures for each question type.
- Fixtures will be used for validation and answer evaluation tests.

## Scope

- In scope:
  - Add fixture objects for each question type.
  - Ensure fixtures pass `aiQuestionSchema` and DB parsers.
- Out of scope:
  - UI rendering tests.

## Changes

- [ ] Create `tests/fixtures/question-types.ts` with valid sample questions for each type.
- [ ] Update existing tests to reuse fixtures where appropriate.

## Acceptance Criteria

- [ ] All fixtures validate successfully with `aiQuestionSchema`.
- [ ] Fixtures are reusable across tests.

## Testing

- [ ] `npm run test:unit` (or relevant unit test command).
