# Task: Validate questionsToAdd in extend-question-set

## Context

- `questionsToAdd` is parsed with `parseInt` but never validated.
- Invalid or negative values can trigger bad AI generation or DB updates.
- Endpoint: `src/app/api/extend-question-set/route.ts`.

## Scope

- In scope:
  - Add validation for `questionsToAdd` (number, integer, > 0, reasonable max).
  - Return clear 400 error on invalid input.
- Out of scope:
  - Changing generation logic or question distribution behavior.

## Changes

- [ ] Add a small Zod schema or manual validation for `questionsToAdd`.
- [ ] Enforce bounds (e.g., 1-200) and handle NaN.
- [ ] Return consistent error response on failure.

## Acceptance Criteria

- [ ] `questionsToAdd` <= 0 or NaN returns 400 with an actionable error message.
- [ ] Valid inputs proceed unchanged.

## Testing

- [ ] Unit/API: invalid `questionsToAdd` → 400.
- [ ] Unit/API: valid `questionsToAdd` → 200 (or success path).
