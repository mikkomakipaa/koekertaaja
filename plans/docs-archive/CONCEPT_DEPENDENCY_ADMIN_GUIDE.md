# Concept Dependency Admin Guide

This guide documents the concept taxonomy and dependency graph used to keep generated question sequences pedagogically coherent.

## Scope

Dependency graphs are currently implemented for:
- `mathematics`
- `finnish`
- `chemistry`
- `physics`
- `society`

Source files:
- `src/config/curriculum/dependencies/mathematics-dependencies.json`
- `src/config/curriculum/dependencies/finnish-dependencies.json`
- `src/config/curriculum/dependencies/chemistry-dependencies.json`
- `src/config/curriculum/dependencies/physics-dependencies.json`
- `src/config/curriculum/dependencies/society-dependencies.json`

## Concept Taxonomy Format

Each concept node uses the following JSON shape:

```json
{
  "id": "snake_case_concept_id",
  "label": "Human-readable concept name",
  "prerequisites": ["concept_id_a", "concept_id_b"],
  "enables": ["next_concept_id"]
}
```

Grade-level grouping uses `grade_<n>` keys.

## How It Is Applied

1. Prompt-time guidance:
- The prompt includes a dependency section from `dependencyResolver.getDependencyPromptSection(subject, grade)`.
- AI is instructed to use dependency concept IDs in `subtopic` when applicable.

2. Post-generation validation and reordering:
- Generated questions are validated with `validateQuestionSet(...)`.
- Violations are logged and questions are reordered with `reorderQuestionsByDependencies(...)`.

3. Admin visibility:
- `ConceptDependencyIndicator` shows whether a question is foundational or has prerequisites.
- `DependencyGraphVisualization` summarizes sequence validity and violations in Test Questions view.

## Analytics and Monitoring

Dependency validation emits structured logs in generation pipelines:
- `Concept dependency validation completed`
- `Dependency violations were detected in generated questions`

These logs include:
- `mode`
- `difficulty`
- `changedOrder`
- `dependencyValid`
- `violationsCaught`
- first violations (sample)

## Maintenance Rules

When editing dependency JSON files:
- Keep IDs in `snake_case`.
- Ensure every prerequisite ID exists in the same subject graph.
- Avoid cycles.
- Keep labels pedagogically clear and grade-appropriate.
- Prefer additive updates for backward compatibility.

## Validation Checklist

- Run `npm run typecheck`
- Run `npm test`
- In `/create` -> Test Questions, verify:
  - dependency status badges render
  - sequence alert reports valid/invalid ordering correctly
