# Task: Add UI flow to create MapQuestion entity via dedicated request

## Context

- Map questions should be created via a separate request, not via general generation.
- UI needs a way to create or attach a map question.

## Scope

- In scope:
  - Add a dedicated UI control (button or modal) to create map questions.
  - Call the new API endpoint for map question creation.
  - Link created map question to a question set if required.
- Out of scope:
  - Refactoring existing quiz/flashcard generation.

## Changes

- [ ] Add UI entry point in Create page or Manage tab.
- [ ] Implement request payload builder for map questions.
- [ ] Update UI to show created map questions (draft/published status if applicable).

## Acceptance Criteria

- [ ] Admin can create a map question through the UI.
- [ ] Request goes to the dedicated map question API.
- [ ] Created map question is visible in management UI.

## Testing

- [ ] Manual: create a map question and verify persistence.
