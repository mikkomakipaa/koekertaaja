# Task: Modularize prompts for subject type + enforce skill/topic separation

## Context

- Prompts are hard to maintain and sometimes ambiguous.
- Need clearer separation by subject type and stricter topic/skill labeling.

## Scope

- In scope:
  - Define subject-type prompt modules (language/written/math).
  - Add explicit skill tagging rules and prevent mixing skills in one question.
  - Ensure prompts emit `skill` and `topic` (and optional `subtopic`) per question.
- Out of scope:
  - UI changes.

## Changes

- [ ] Add or update prompt modules under `src/config/prompt-templates/` to include:
  - [ ] `core/skill-tagging.txt` rules (if not already present).
  - [ ] `types/language.txt`, `types/written.txt`, `types/math.txt` refinements.
- [ ] Update `PromptBuilder` to include new modules consistently.
- [ ] Update prompt JSON schemas if needed to include `skill` and `subtopic` fields.

## Acceptance Criteria

- [ ] Generated prompts clearly instruct model to output `topic` + `skill` (and optional `subtopic`).
- [ ] Subject-type modules reduce ambiguity and keep rules scoped to language/written/math.
- [ ] Prompt assembly succeeds without missing variables.

## Testing

- [ ] Manual: run a generation for each subject type and verify output includes `skill` tags.
