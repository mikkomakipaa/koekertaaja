# Task: Add DB fields for subject type and question skills

## Context

- We need to persist generation context (subject type) and per-question skill labels.
- Current schema has `questions.topic` but no `skill` or `subject_type` on sets.

## Scope

- In scope:
  - Add `subject_type` to `question_sets`.
  - Add `skill` (or `skill_tags`) and optional `subtopic` to `questions`.
  - Update generated types and insert logic to store these fields.
  - Document changes in `DWF/adr/ADR-001-core-architecture.md`.
- Out of scope:
  - Backfilling historical data.

## Changes

- [ ] Create migration to add `question_sets.subject_type`.
- [ ] Create migration to add `questions.skill` (TEXT) and `questions.subtopic` (TEXT, optional).
- [ ] Update `src/types/database.ts` and relevant domain types.
- [ ] Update `src/lib/supabase/write-queries.ts` to persist `subject_type`, `skill`, and `subtopic`.
- [ ] Document schema changes in `DWF/adr/ADR-001-core-architecture.md`.

## Acceptance Criteria

- [ ] New fields exist in Supabase schema and types compile.
- [ ] Newly generated questions store `skill` and `subtopic` when provided.
- [ ] Question sets store `subject_type`.

## Testing

- [ ] Unit/API: create question set with `subject_type` and `skill` data, verify persistence.
