# Task: Calculate element positions for matching connections

## Context

- Why this is needed: To draw SVG lines connecting matched pairs, we need accurate DOM element positions. Current matching questions show matches only as small text arrows.
- Related docs/links: Part of Matching Visual Connections improvement (5 pts total)
- Related files:
  - `src/components/questions/Matching.tsx` - Main matching component

## Scope

- In scope:
  - Add refs to track left and right item DOM elements
  - Calculate getBoundingClientRect() for matched pairs
  - Store positions in component state
  - Recalculate on window resize (debounced)
  - Handle scroll position offset

- Out of scope:
  - SVG rendering (separate task)
  - Mobile view (connections only on desktop)
  - Animation of position changes

## Changes

- [ ] Add id attributes to matching items: id="left-{id}" and id="right-{id}"
- [ ] Create ConnectionPosition interface with leftId, rightId, x1, y1, x2, y2
- [ ] Implement calculateConnectionPositions() function
- [ ] Use getBoundingClientRect() to get element positions
- [ ] Calculate line endpoints (right edge of left item, left edge of right item)
- [ ] Store positions in state
- [ ] Add debounced resize listener (250ms)
- [ ] Recalculate on match creation/removal

## Acceptance Criteria

- [ ] All matching items have id="left-{id}" or id="right-{id}" attributes
- [ ] ConnectionPosition interface defined with required fields
- [ ] calculateConnectionPositions() function created
- [ ] Positions calculated correctly using getBoundingClientRect()
- [ ] Line endpoints connect right edge of left to left edge of right
- [ ] Positions update when matches change
- [ ] Window resize triggers recalculation (debounced)
- [ ] Works with page scrolling
- [ ] No performance issues (debouncing effective)

## Testing

- [ ] Tests to run:
  - Create match, verify positions calculated
  - Resize window, verify positions update
  - Scroll page, verify positions adjust
  - Test with different viewport sizes

- [ ] New/updated tests:
  - Unit test for calculateConnectionPositions()
  - Test resize debouncing
  - Test position accuracy
