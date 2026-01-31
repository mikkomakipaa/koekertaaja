# Task: Align question count limits across UI, API, and prompts

## Context

- UI currently allows 40-400 questions, but new target is 40-200.
- Subject configs already include per-subject min/max/default.
- Prompt distributions and AI output should align with requested ranges.

## Scope

- In scope:
  - Align UI slider, API validation, and prompt variables with 40-200 range.
  - Respect per-subject min/max in `subjects.ts`.
  - Ensure prompt builder uses requested count consistently.
- Out of scope:
  - Changing distribution logic beyond range alignment.

## Changes

- [ ] Update `createQuestionSetSchema` to enforce questionCount <= 200.
- [ ] Ensure API returns clear errors when limits are exceeded.
- [ ] Update prompt templates or builder notes if they reference 40-400.

## Acceptance Criteria

- [ ] UI, API, and prompts all cap question count at 200.
- [ ] Validation rejects values above 200 with a 400 error.

## Testing

- [ ] Unit/API: questionCount > 200 returns 400.
- [ ] Manual: slider max is 200 and aligns with subject config.
