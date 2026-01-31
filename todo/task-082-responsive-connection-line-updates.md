# Task: Handle responsive updates for connection lines

## Context

- Why this is needed: Connection lines should only appear on desktop (where two-column layout exists). On mobile, matching uses single-column paired view, so lines are not needed and could cause visual clutter.
- Related docs/links: Part of Matching Visual Connections improvement, depends on task-080 and task-081
- Related files:
  - `src/components/questions/Matching.tsx` - Add responsive handling

## Scope

- In scope:
  - Hide connection lines on mobile (<768px)
  - Show lines only on desktop (≥768px)
  - Update lines on window resize
  - Handle scroll events if needed
  - Clean up event listeners on unmount

- Out of scope:
  - Mobile-specific connection UI
  - Connection animations
  - Touch gesture handling

## Changes

- [ ] Add CSS to hide SVG on mobile: className="hidden md:block"
- [ ] Implement debounced resize handler (250ms delay)
- [ ] Call updateConnectionPositions() on resize
- [ ] Add resize event listener in useEffect
- [ ] Clean up event listener on component unmount
- [ ] Handle tab visibility change if needed
- [ ] Verify lines accurate after all layout changes

## Acceptance Criteria

- [ ] Connection lines only visible on desktop (≥768px width)
- [ ] Lines hidden on mobile/tablet (<768px)
- [ ] Lines update correctly on window resize
- [ ] Resize handler debounced to 250ms to prevent performance issues
- [ ] Event listeners cleaned up on unmount
- [ ] Lines accurate after all layout changes
- [ ] No visual glitches during transitions
- [ ] No performance degradation from resize handling

## Testing

- [ ] Tests to run:
  - Resize from desktop to mobile, verify lines disappear
  - Resize from mobile to desktop, verify lines appear
  - Resize desktop viewport, verify lines adjust
  - Complete quiz and check for event listener leaks
  - Test performance with rapid resizing

- [ ] New/updated tests:
  - Test responsive visibility (md: breakpoint)
  - Test resize debouncing
  - Test cleanup on unmount
