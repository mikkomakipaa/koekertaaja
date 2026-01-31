# Task: Add dedicated flashcard count setting

## Context

- Flashcard generation currently uses the same questionCount as quiz.
- Need a separate user-controlled count for flashcards.

## Scope

- In scope:
  - Add flashcard count control on Create page (only for flashcard/both modes).
  - Pass `flashcardCount` to `/api/generate-questions`.
  - Store flashcard count per set if needed.
- Out of scope:
  - Redesigning quiz count controls.

## Changes

- [ ] Update Create page UI state to include `flashcardCount` and validation.
- [ ] Extend `createQuestionSetSchema` to accept `flashcardCount`.
- [ ] Update `/api/generate-questions` to use `flashcardCount` for flashcard generation.
- [ ] If persistent storage is needed, add `flashcard_count` column to `question_sets` and update migrations/types.
- [ ] Update response payloads/tests if necessary.

## Acceptance Criteria

- [ ] Flashcard count slider controls flashcard generation size.
- [ ] Quiz question count remains unaffected.
- [ ] If stored, `flashcard_count` is persisted for flashcard sets only.

## Testing

- [ ] Manual: create flashcards with a custom count and verify output size.
