# Task: Update prompts to generate Map questions for geography

## Context

- Map questions should only be generated for geography.
- Prompts need explicit instructions for map question format and constraints.

## Scope

- In scope:
  - Add map question instructions to geography prompt modules.
  - Ensure map questions are excluded for non-geography subjects.
  - Align distribution rules to include "map" where applicable.
- Out of scope:
  - UI rendering.

## Changes

- [ ] Update geography prompt templates to include map question type definition and examples.
- [ ] Update grade distributions (if needed) to include a small % for map questions.
- [ ] Ensure PromptBuilder only allows map type when subject is geography.

## Acceptance Criteria

- [ ] Geography prompts can emit map questions using the defined schema.
- [ ] Other subjects never receive map questions.
- [ ] Prompts remain valid JSON outputs for other types.

## Testing

- [ ] Manual: generate geography set and verify at least one map question appears.
