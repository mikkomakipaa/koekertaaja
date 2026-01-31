# Task: Accept subject type and prompt profile in API + schema

## Context

- The new prompt system needs explicit subject type for custom subjects.
- API payload currently lacks `subjectType` and any prompt profile signals.

## Scope

- In scope:
  - Update validation schemas to accept `subjectType` (and `promptProfile` if needed).
  - Pass `subjectType` through to `questionGenerator`/`PromptBuilder`.
  - Validate subject type enum and handle missing values appropriately.
- Out of scope:
  - UI changes (handled elsewhere).

## Changes

- [ ] Extend `createQuestionSetSchema` in `src/lib/validation/schemas.ts` with `subjectType` (and `promptProfile` if required).
- [ ] Update `/api/generate-questions` to read and validate `subjectType`.
- [ ] Pass `subjectType` to `generateQuestions` and `PromptBuilder` so custom subjects are classified correctly.
- [ ] Update types in `src/types` to include subject type where appropriate.

## Acceptance Criteria

- [ ] API accepts `subjectType` and validates it.
- [ ] Custom subject generation uses provided subject type instead of inference.
- [ ] No breaking changes for existing clients that omit `subjectType`.

## Testing

- [ ] Unit/API: request with invalid `subjectType` returns 400.
- [ ] Unit/API: request with valid `subjectType` succeeds.
