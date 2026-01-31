# Task: Ensure flashcard mode uses dedicated flashcard templates

## Context

- Flashcard series is currently using the quiz/question-set template instead of the dedicated flashcard template.
- This causes incorrect distributions and formatting in flashcard mode.

## Scope

- In scope:
  - Identify where template selection happens for flashcards.
  - Ensure flashcard mode loads the correct prompt modules.
  - Verify correct template paths for flashcard prompts.
- Out of scope:
  - Prompt content changes (handled separately).

## Changes

- [ ] Review `PromptBuilder` and `questionGenerator` selection logic for `mode: 'flashcard'`.
- [ ] Ensure flashcard mode uses `prompt-templates/flashcard/*` or equivalent modules.
- [ ] Add/adjust tests (if present) to validate template selection.

## Acceptance Criteria

- [ ] Flashcard generation uses dedicated flashcard prompt template(s).
- [ ] Quiz generation remains unchanged.

## Testing

- [ ] Manual: generate flashcards and verify output format/types follow flashcard rules.
