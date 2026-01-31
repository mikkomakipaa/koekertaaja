# Task: Decide map question integration model (inline vs dedicated profile)

## Context

- Map questions are currently part of the normal process but not reliably generated.
- Need to decide whether map is:
  - a special case inside geography prompts, or
  - a dedicated generation profile/mode.

## Scope

- In scope:
  - Define approach (inline map type vs dedicated profile).
  - Update prompt routing in `PromptBuilder` accordingly.
  - Add documentation on how map questions are triggered.
- Out of scope:
  - Implementing UI changes beyond the routing decision.

## Changes

- [ ] Document decision in `DWF/adr/ADR-001-core-architecture.md`.
- [ ] If using a dedicated profile, add `promptProfile` handling in generation.
- [ ] If inline, add explicit conditions for geography-only map inclusion.

## Acceptance Criteria

- [ ] Clear documented decision on map integration.
- [ ] Prompt routing updated to match the decision.

## Testing

- [ ] Manual: verify map questions appear only when expected.
