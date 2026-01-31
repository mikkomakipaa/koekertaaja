# Task: Add Map question type to types and persistence

## Context

- The new "map" question type must be recognized throughout the app.
- Storage should use existing JSONB columns (`options`, `correct_answer`) without new tables.

## Scope

- In scope:
  - Extend TypeScript unions/types to include `map`.
  - Update schema validation to accept `map` questions.
  - Ensure `write-queries` stores map-specific fields correctly.
- Out of scope:
  - UI rendering or prompt authoring.

## Changes

- [ ] Update `src/types` question type unions to include `map`.
- [ ] Update Zod schemas in `src/lib/validation/schemas.ts` for map question payload.
- [ ] Update `src/lib/supabase/write-queries.ts` to handle `map` question type mapping.
- [ ] Update any parse helpers (`src/types/database.ts`) to accept map fields.

## Acceptance Criteria

- [ ] Map questions can be persisted without type errors.
- [ ] Validation accepts map question JSON shape from API.
- [ ] No regressions for existing question types.

## Testing

- [ ] Unit/API: create question set including a map question and verify persistence.
