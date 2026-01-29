# Task: Add quiz exit confirmation modal

## Context

- Why this is needed: Users can accidentally exit an in-progress quiz via the “Lopeta” button; add a confirmation like flashcards so progress is not lost unintentionally.
- Related docs/links: None.
- Related files: `src/app/play/[code]/page.tsx`, `src/components/play/FlashcardSession.tsx` (reference UX copy/style).

## Scope

- In scope:
  - Add an exit confirmation dialog for quiz mode when a quiz has started.
  - Match copy/visual style with flashcard exit confirmation.
  - Keep behavior consistent for review mode if applicable.
- Out of scope:
  - Changing flashcard confirmation behavior.
  - Changing routing or persistence logic.

## Changes

- [ ] In quiz mode, replace direct “Lopeta” navigation with a confirm modal when progress exists.
- [ ] Use similar text/layout to flashcard confirmation, with quiz-specific progress (current question / total) and color-style.
- [ ] Ensure cancel keeps user in session and confirm exits to browse/menu.

## Acceptance Criteria

- [ ] Clicking “Lopeta” in an in-progress quiz shows a confirmation modal.
- [ ] Confirm exits the quiz; cancel closes the modal without losing state.
- [ ] Modal copy and styling are consistent with `FlashcardSession` confirmation.

## Testing

- [ ] Tests to run: `npm run typecheck` (if available).
- [ ] New/updated tests: Not required.
