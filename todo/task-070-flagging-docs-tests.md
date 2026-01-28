# Task: Flagging docs and tests

## Context

- New feature adds anonymous flagging, admin review, and edits.
- Documentation and minimal tests should be updated.
- Related files:
  - docs/TESTING_GUIDE.md
  - docs/SECURITY_REVIEW.md (if needed for anon endpoints)
  - tests/ (if applicable)

## Scope

- In scope:
  - Update testing guide with steps for flagging + admin review.
  - Add minimal API test coverage if project has pattern.
- Out of scope:
  - Full E2E automation.

## Changes

- [ ] Add testing checklist entries for flagging and admin edit flow.
- [ ] Add minimal tests for POST /api/question-flags rate limit (if feasible).

## Acceptance Criteria

- [ ] docs/TESTING_GUIDE.md includes flagging workflow checks.
- [ ] Tests (if added) pass locally.

## Testing

- [ ] Run any new tests added.
