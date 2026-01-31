# Task: Enforce map-only questions for Geography subject type

## Context

- Geography subject type should generate only map questions.
- Current prompts allow other question types, so map questions are not guaranteed.

## Scope

- In scope:
  - Update geography prompts to allow only `type: map`.
  - Update distributions to 100% map for geography.
  - Add server-side validation to reject geography output with non-map types.
- Out of scope:
  - UI changes beyond existing subject type selector.

## Changes

- [ ] Update `src/config/prompt-templates/types/geography.txt` to explicitly forbid non-map types.
- [ ] Update `src/config/prompt-templates/core/grade-distributions.json` for geography to map-only.
- [ ] Add validation in `questionGenerator` to enforce all `type === 'map'` when subjectType is geography.
- [ ] Update docs (prompt rules) if necessary.

## Acceptance Criteria

- [ ] Geography sets contain only map questions.
- [ ] Generation fails (or retries) if any non-map question appears.

## Testing

- [ ] Manual: generate a geography set and confirm all questions are `map`.
