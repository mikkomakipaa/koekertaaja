# Task: Add validation tests for all question types

## Context

- Current tests cover some types but not all.
- Need a suite that verifies each type passes schema validation.

## Scope

- In scope:
  - Add tests that validate fixtures against `aiQuestionSchema`.
  - Add negative tests for missing required fields per type.
- Out of scope:
  - End-to-end tests.

## Changes

- [ ] Add `tests/question-type-schema.test.ts` using fixtures.
- [ ] Add failing cases (e.g., missing options, empty pairs, invalid map regions).

## Acceptance Criteria

- [ ] Each question type has a passing test.
- [ ] Each type has at least one failing test for required fields.

## Testing

- [ ] `npm run test:unit`.
