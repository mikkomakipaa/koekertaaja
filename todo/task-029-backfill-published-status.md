# Task: Backfill existing question sets to published status

## Context

- New `question_sets.status` defaults to `created`.
- Existing sets should remain visible on Play pages after the change.

## Scope

- In scope:
  - Add a one-time migration or script to set `status = 'published'` for existing rows.
- Out of scope:
  - Ongoing automation beyond initial backfill.

## Changes

- [ ] Add a SQL migration to update all existing `question_sets` rows to `published`.
- [ ] Document the backfill in the migration README or ADR.

## Acceptance Criteria

- [ ] After migration, existing question sets are visible in Play pages.
- [ ] New question sets default to `created` unless published by admin.

## Testing

- [ ] Manual: confirm a pre-existing set still appears after migration.
