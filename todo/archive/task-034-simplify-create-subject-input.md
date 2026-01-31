# Task: Simplify Create page subject input

## Context

- Create page currently has “Valitse listalta / Oma aine” selection and preset subject options.
- Requested change: single text field for subject plus topic and sub-topic fields.
- Keep Aineen tyyppi as a dropdown; other elements unchanged.

## Scope

- In scope:
  - Remove subject mode toggle and preset subject list.
  - Add text inputs for `subject`, `topic`, and `subtopic`.
  - Keep subject type dropdown (`Aineen tyyppi`).
  - Ensure form validation and API payload include topic/subtopic.
- Out of scope:
  - Changes to generation logic or prompt content.

## Changes

- [ ] Remove subject mode state and `getEnabledSubjects()` usage.
- [ ] Add subject text input plus topic/subtopic inputs in Create form.
- [ ] Keep `subjectType` dropdown required.
- [ ] Update payload in `handleSubmit` to include `topic` and `subtopic`.
- [ ] Adjust validation flags (subjectType required).

## Acceptance Criteria

- [ ] Create page shows a single subject text input.
- [ ] Topic and sub-topic fields are present and optional.
- [ ] Aineen tyyppi dropdown remains and is required.
- [ ] Submit sends subject/topic/subtopic to API.

## Testing

- [ ] Manual: submit with subject + subject type, optional topic/subtopic.
