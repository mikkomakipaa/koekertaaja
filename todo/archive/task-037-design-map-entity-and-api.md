# Task: Design separate MapQuestion entity and creation API

## Context

- Map questions should be created via a dedicated request and stored as a separate entity.
- Current schema stores map questions in the general `questions` table.

## Scope

- In scope:
  - Define a new table or entity for map questions (e.g., `map_questions`).
  - Define the payload schema and API endpoint for creating map questions.
  - Document how map questions relate to `question_sets` (if at all).
- Out of scope:
  - UI integration (separate task).

## Changes

- [ ] Propose table schema (`map_questions`) including map asset, regions, correct answers, metadata.
- [ ] Decide relation to `question_sets` (foreign key or standalone).
- [ ] Draft API contract (request/response JSON) for map question creation.
- [ ] Update `docs/API_SCHEMAS.md` with the new entity schema.

## Acceptance Criteria

- [ ] Map question entity schema and API contract are documented.
- [ ] Relationship to existing question sets is explicitly defined.

## Testing

- [ ] None (design task).
