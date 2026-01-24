# Task: Update AI prompts with map question examples for geography

## Context

- AI must generate valid map questions following the enhanced schema.
- Prompts need clear examples and constraints for map questions.
- Map questions should only be generated for geography subjects.
- Need to specify which maps are available (world, europe, finland, etc.).
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`, `task-021-prompts-geography-map.md`
- Related files: `src/lib/prompts/`, `src/config/prompt-templates/subjects/`

## Scope

- In scope:
  - Add map question type definition to geography prompt templates.
  - Provide 3-5 complete map question examples in prompts.
  - Update grade distributions to allocate 10-15% to map questions.
  - Add validation rules for map question generation.
  - Document available maps in prompt context.
- Out of scope:
  - Generating custom maps (use predefined maps only).
  - Non-geography subjects (enforce geography-only constraint).

## Changes

- [ ] Update `src/config/prompt-templates/subjects/geography.json` (or create if missing).
- [ ] Add map question type definition and schema to geography prompts.
- [ ] Add 5 example map questions covering different scenarios:
  - Example 1: Select Nordic countries (multi-region)
  - Example 2: Identify Finland on Europe map (single-region)
  - Example 3: Select EU member states (multi-region, validation rules)
  - Example 4: Find capital city (text answer with map context)
  - Example 5: Select countries bordering Russia (multi-region, complex)
- [ ] Update `src/config/prompt-templates/core/grade-distributions.json` to include map questions.
- [ ] Add constraint: "ONLY generate map questions for geography subject".
- [ ] List available maps in prompt context (world-110m, europe-50m, finland-regions-10m).

## Acceptance Criteria

- [ ] Geography prompts include map question type in allowed types.
- [ ] Prompts contain 5 diverse map question examples.
- [ ] Grade distributions allocate 10-15% to map questions (adjustable per grade).
- [ ] Geography-only constraint is explicitly stated in prompts.
- [ ] Available maps are documented in prompt context section.
- [ ] AI generates valid map questions that pass schema validation.

## Testing

- [ ] Manual: Generate geography question set (grade 4-6) and verify map questions appear.
- [ ] Manual: Verify map questions match schema (run through Zod validation).
- [ ] Manual: Generate non-geography set and verify NO map questions appear.
- [ ] Manual: Check map question distribution is ~10-15% of total.
- [ ] Review: Have human review generated map questions for quality/accuracy.
