# Task: Render SVG connection lines for matching

## Context

- Why this is needed: Visual lines make matched pairs immediately obvious, replacing hard-to-read text arrows. Improves clarity and visual feedback.
- Related docs/links: Part of Matching Visual Connections improvement, depends on task-080
- Related files:
  - `src/components/questions/Matching.tsx` - Add SVG overlay

## Scope

- In scope:
  - Create SVG overlay positioned absolutely over matching area
  - Render dashed blue lines between matched pairs
  - Use positions from task-080
  - Ensure lines don't block clicking (pointer-events-none)
  - Support dark mode

- Out of scope:
  - Animated line drawing
  - Interactive lines (clicking, hovering)
  - Mobile view (desktop only)

## Changes

- [ ] Add SVG element with absolute positioning
- [ ] Position SVG to cover matching question area (inset-0)
- [ ] Set pointer-events-none to allow clicking through
- [ ] Set z-index: 1 to layer above background but below items
- [ ] Map over connectionPositions to render lines
- [ ] Use stroke color rgb(59, 130, 246) (indigo-500)
- [ ] Set strokeWidth="2"
- [ ] Set strokeDasharray="5,5" for dashed lines
- [ ] Add dark mode support if needed

## Acceptance Criteria

- [ ] SVG overlay renders above matching items
- [ ] Lines connect matched pairs visually at correct positions
- [ ] Lines don't interfere with clicking items (pointer-events-none works)
- [ ] Blue color matches theme (indigo-500: rgb(59, 130, 246))
- [ ] Dashed line style applied (strokeDasharray="5,5")
- [ ] 2px stroke width
- [ ] Lines visible in dark mode
- [ ] Lines update immediately when matches change
- [ ] No visual glitches or overlaps

## Testing

- [ ] Tests to run:
  - Create match, verify line appears
  - Remove match, verify line disappears
  - Test line color and style
  - Click items with lines present, verify clicking works
  - Test in dark mode

- [ ] New/updated tests:
  - Component test for SVG rendering
  - Test line coordinates match positions
  - Verify pointer events disabled
