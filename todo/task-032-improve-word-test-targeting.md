# Task: Improve word-test prompt targeting for exact vocabulary

## Context

- Word tests (e.g., fruits/berries) miss exact target words and focus on common phrases.
- Topic/subtopic alone may not enforce the needed specificity.

## Scope

- In scope:
  - Add prompt guidance to enforce inclusion of exact target words.
  - Use explicit target word lists when provided.
  - Add guardrails to avoid drifting into unrelated common phrases.
- Out of scope:
  - UI changes for entering word lists (unless already supported).

## Changes

- [ ] Update language/word-test prompt modules to require exact inclusion of provided target words.
- [ ] Add a structured section in prompts for "Required vocabulary" when a list is available.
- [ ] Add a validation pass to reject generations that miss required words (if feasible).

## Acceptance Criteria

- [ ] Word-test generation includes the exact requested vocabulary.
- [ ] Output avoids drifting into general phrases when a target list is provided.

## Testing

- [ ] Manual: generate a word test with specific fruit/berry list and verify inclusion.
