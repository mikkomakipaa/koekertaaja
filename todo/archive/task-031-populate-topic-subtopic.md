# Task: Populate topic/subtopic consistently in DB

## Context

- `topic` and `subtopic` fields are empty in DB, weakening targeting and filtering.
- Prompts and parsing may not be enforcing these fields.

## Scope

- In scope:
  - Ensure AI output includes `topic` and optional `subtopic` per question.
  - Ensure persistence logic stores topic/subtopic correctly.
  - Add validation for missing topic/subtopic where required.
- Out of scope:
  - Backfilling historical data (separate task if needed).

## Changes

- [ ] Update prompt instructions to require `topic` and optional `subtopic` values.
- [ ] Update Zod schemas to validate topic/subtopic presence when expected.
- [ ] Ensure `write-queries` persists `topic`/`subtopic` for all question types.
- [ ] Add a regression test for non-empty topic/subtopic in generated payloads.

## Acceptance Criteria

- [ ] Newly generated questions have non-empty `topic` and (when applicable) `subtopic`.
- [ ] Database rows store `topic`/`subtopic` correctly.

## Testing

- [ ] Unit/API: generated question payload includes topic/subtopic.
