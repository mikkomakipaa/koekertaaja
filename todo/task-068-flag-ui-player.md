# Task: Add flag UI for pupils after submitting answer

## Context

- Pupils should be able to flag a question as wrong after submitting.
- UI appears when the correct answer/explanation is shown (post-submit).
- Flags are anonymous; clientId stored in localStorage.
- Related files:
  - src/app/play/[code]/page.tsx
  - src/components/questions/QuestionRenderer (if needed)
  - src/components/ui/* (dialogs, buttons)

## Scope

- In scope:
  - Add “Ilmoita virhe” action in the post-answer view.
  - Prompt for reason (enum) and optional note.
  - Submit to `/api/question-flags` with clientId.
  - Show success/failure feedback.
- Out of scope:
  - Admin review UI.

## Changes

- [ ] Generate/stash `clientId` in localStorage (uuid) on first use.
- [ ] Add flag button visible only when `showExplanation` is true.
- [ ] Add modal/dialog with reason options: wrong_answer, ambiguous, typo, other; optional note.
- [ ] POST to `/api/question-flags` with questionId + questionSetId.
- [ ] Disable button after successful submission for that question in-session.

## Acceptance Criteria

- [ ] Flag UI only appears after submitting an answer.
- [ ] Successful submission shows confirmation (toast or inline text).
- [ ] Errors are user-friendly and don’t break gameplay.

## Testing

- [ ] Manual: flag a question and confirm API call success.
- [ ] Manual: exceed 3 flags and see 429 message.
