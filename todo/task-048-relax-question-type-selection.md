# Task: Relax AI question type selection constraints

## Context

- Why this is needed: AI should choose the most suitable question type per question, rather than strictly following a fixed distribution. Scope is written subject type in quiz mode.
- Related docs/links: `src/config/prompt-templates/core/grade-distributions.json`, `src/config/prompt-templates/types/*.txt`, `src/lib/prompts/PromptBuilder.ts`
- Related files:
  - `src/config/prompt-templates/types/language.txt`
  - `src/config/prompt-templates/types/math.txt`
  - `src/config/prompt-templates/types/written.txt`
  - `src/config/prompt-templates/types/skills.txt`
  - `src/config/prompt-templates/types/concepts.txt`
  - `src/lib/prompts/PromptBuilder.ts`
  - `src/config/prompt-templates/core/grade-distributions.json`

## Scope

- In scope:
  - Apply relaxed distributions for written subject type in quiz mode only.
  - Keep other subject types and flashcard mode unchanged.
  - Soften prompt language so distributions are guidance, not strict requirements.
  - Ensure prompts explicitly say “choose the most suitable type for the content.”
- Out of scope:
  - Reworking schema validation logic or question parsing.
  - New UI controls or settings.

## Changes

- [ ] Update written prompt template to remove “NOUDATA TARKASTI … jakaumaa” and replace with guidance language (e.g., “pyri noudattamaan… mutta valitse sopivin tyyppi sisällön mukaan”).
- [ ] Add an explicit line in the prompt that AI should choose the most suitable type per question based on the material.
- [ ] Adjust `PromptBuilder` distribution header or include a short note marking distributions as guidelines for written/quiz (not strict rules), OR update `grade-distributions.json` usage accordingly.
- [ ] Add/adjust history-specific target to ~15% sequential for written/quiz (guideline, not strict).

## Acceptance Criteria

- [ ] Prompt output for written/quiz no longer uses strict language for distributions.
- [ ] Prompt output explicitly instructs the model to choose the most suitable type per question.
- [ ] Geography map-only enforcement remains unchanged.
- [ ] Flashcard invalid types (multiple_choice, true_false, sequential) remain excluded.
- [ ] Manual test: generate a written/history quiz set and confirm type mix is content-driven (sequential appears when timeline content exists and roughly targets 15%).

## Testing

- [ ] Tests to run: (manual) create a history set with timeline content and inspect the generated types.
- [ ] New/updated tests: none.
