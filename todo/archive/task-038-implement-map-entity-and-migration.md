# Task: Implement map_questions entity and migrations

## Context

- Map questions are being moved to a dedicated entity with its own storage.

## Scope

- In scope:
  - Create Supabase migration for `map_questions` table.
  - Add types and DB parsers for the new entity.
  - Implement write/read helpers under `src/lib/db` or Supabase helpers.
- Out of scope:
  - Prompt changes and UI changes (separate tasks).

## Changes

- [ ] Add migration to create `map_questions` table.
- [ ] Update `src/types` and `src/types/database.ts` for the new entity.
- [ ] Add query helpers for CRUD operations on map questions.

## Acceptance Criteria

- [ ] Migration creates `map_questions` table with required fields.
- [ ] TypeScript types compile.
- [ ] CRUD helpers exist and are unit-tested if applicable.

## Testing

- [ ] Unit/API: create and fetch a map question via helpers.
