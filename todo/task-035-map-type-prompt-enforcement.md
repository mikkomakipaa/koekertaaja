# Task: Enforce map questions for geography prompts

## Context

- Geography map test prompts are producing normal questions instead of `map` type.
- Map should be its own question type within the normal generation pipeline.

## Scope

- In scope:
  - Update geography prompt modules to explicitly require at least one `map` question.
  - Make `map` type constraints explicit (schema fields, mapAsset, regions).
  - Ensure the map type is only allowed when subject is geography.
- Out of scope:
  - UI changes.

## Changes

- [ ] Update `src/config/prompt-templates/subjects/geography-map.txt` to mandate `map` type output count (e.g., 1-2 questions).
- [ ] Update `src/config/prompt-templates/types/written.txt` (and related types) to clarify that map type is only for geography.
- [ ] Add a small validation warning if geography output contains zero `map` questions.

## Acceptance Criteria

- [ ] Geography generation includes at least one `map` question.
- [ ] Non-geography subjects do not produce `map` questions.

## Testing

- [ ] Manual: generate a geography set and confirm at least one map question is present.
