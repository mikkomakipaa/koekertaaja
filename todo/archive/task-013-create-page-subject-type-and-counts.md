# Task: Update create page for subject type selection and per-subject counts

## Context

- Create page currently uses free-text `subject` and hardcoded question count range (40-400).
- Prompt system now supports subject types and modular prompt loading.
- Need UI support for subject selection and subject type for custom subjects.

## Scope

- In scope:
  - Use `src/config/subjects.ts` to drive subject selection UI.
  - Add subject type selection for custom subjects (language/written/math/skills/concepts).
  - Align question count min/max/default with subject config and new max 200.
  - Ensure grade selection is visible and required when subject type uses grade distributions.
- Out of scope:
  - Changing generation logic or prompt templates.

## Changes

- [ ] Replace free-text subject input with a subject picker using `getEnabledSubjects()`.
- [ ] Add a toggle or dropdown to enter a custom subject and choose a subject type.
- [ ] Update question count slider to use subject config min/max (cap at 200) and default.
- [ ] Include `subjectType` in form state and pass it in the `/api/generate-questions` request.
- [ ] Update UI copy to explain subject type selection for custom subjects.

## Acceptance Criteria

- [ ] User can choose a predefined subject or enter a custom subject.
- [ ] Custom subjects require a subject type selection.
- [ ] Question count slider respects per-subject min/max and 200 cap.
- [ ] `subjectType` is included in the POST to `/api/generate-questions`.

## Testing

- [ ] Manual: create a set with predefined subject and verify request payload.
- [ ] Manual: create a set with custom subject and required subject type.
