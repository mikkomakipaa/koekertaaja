# Task: Add answer evaluation tests per question type

## Context

- Answer evaluation is core logic and should be verified per question type.
- Map type already has some tests, but the full suite is missing.

## Scope

- In scope:
  - Add tests for answer evaluation for all question types.
  - Reuse fixtures for input/output expectations.
- Out of scope:
  - UI tests.

## Changes

- [ ] Create `tests/answer-evaluation-per-type.test.ts`.
- [ ] Include map single/multi/text cases, fill_blank leniency, matching, sequential.

## Acceptance Criteria

- [ ] Each question type has at least one evaluation test.
- [ ] Map cases cover all input modes.

## Testing

- [ ] `npm run test:unit`.
