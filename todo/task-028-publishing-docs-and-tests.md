# Task: Document publishing workflow and add tests

## Context

- Publishing introduces a new lifecycle for question sets.
- Needs documentation and basic test coverage.

## Scope

- In scope:
  - Document status flow in `Documentation/IMPLEMENTATION_PLAN.md` or `DWF/ADR-001-core-architecture.md`.
  - Add tests for status filtering and publish API.
- Out of scope:
  - End-to-end tests unless existing setup already includes them.

## Changes

- [ ] Document the lifecycle: created -> published.
- [ ] Add unit/API tests for status filtering and publish permissions.

## Acceptance Criteria

- [ ] Docs describe status values and who can change them.
- [ ] Tests cover filtering and publish authorization.

## Testing

- [ ] `npm run test:unit` (or relevant command per `Documentation/TESTING_GUIDE.md`).
