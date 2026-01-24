# Task: Add status field for publishing workflow

## Context

- Question sets need a simple publish gate: created vs published.
- Only published sets should appear on Play pages.

## Scope

- In scope:
  - Add `status` to `question_sets` with enum values `created` | `published`.
  - Default to `created` for new sets.
  - Update types and docs.
- Out of scope:
  - Role management beyond admin allowlist (handled elsewhere).

## Changes

- [ ] Add Supabase migration to add `status` column with default `created`.
- [ ] Update types in `src/types` and database parsers.
- [ ] Update `DWF/adr/ADR-001-core-architecture.md` to document publishing status.

## Acceptance Criteria

- [ ] New question sets default to `created`.
- [ ] Status is available in types and query results.

## Testing

- [ ] Unit/API: verify new sets have `status = created`.
