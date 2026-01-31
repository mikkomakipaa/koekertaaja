# Task: Implement Map question UI for gameplay

## Context

- New "map" question type needs a UI for selecting/typing regions on a map.
- Must be mobile-friendly and accessible.

## Scope

- In scope:
  - Create a new `MapQuestion` component under `src/components/questions/`.
  - Render map asset and allow selecting regions (click/tap).
  - Handle answer submission and feedback via existing game session flow.
- Out of scope:
  - Admin tooling for creating map assets.

## Changes

- [ ] Add `MapQuestion` component and wire into question renderer switch.
- [ ] Implement region selection (hit areas or overlay buttons) based on schema.
- [ ] Provide keyboard accessible selection for all regions.
- [ ] Ensure correct/incorrect feedback matches existing patterns.

## Acceptance Criteria

- [ ] Map questions render a map and allow selecting the correct region.
- [ ] Works on mobile touch targets and keyboard navigation.
- [ ] Non-map questions remain unchanged.

## Testing

- [ ] Manual: play a geography set containing a map question.
