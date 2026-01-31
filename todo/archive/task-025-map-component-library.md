# Task: Map component library with react-simple-maps

## Context

- Map questions need reusable, performant UI components for rendering interactive maps.
- Use `react-simple-maps` for SVG-based maps with TopoJSON support.
- Components must support multiple interaction modes (select regions, place pins, etc.).
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`, `task-022-ui-map-question-component.md`
- Related files: `src/components/questions/`, `src/components/ui/`

## Scope

- In scope:
  - Install and configure `react-simple-maps`, `d3-geo`, `topojson-client`.
  - Create core map components (`InteractiveMap`, `RegionSelector`, `MapControls`).
  - Implement zoom, pan, and reset functionality.
  - Support touch gestures for mobile.
  - Create reusable hook `useMapInteraction` for shared logic.
- Out of scope:
  - Advanced features like route drawing or distance estimation (future tasks).
  - Answer validation logic (handled by existing answer-evaluation module).

## Changes

- [ ] Install dependencies: `npm install react-simple-maps d3-geo topojson-client`.
- [ ] Create `/src/components/questions/map/` directory.
- [ ] Create `InteractiveMap.tsx` - Base map renderer with projection support.
- [ ] Create `RegionSelector.tsx` - Handles region click/selection logic.
- [ ] Create `MapControls.tsx` - Zoom in/out, pan, reset buttons.
- [ ] Create `PinPlacer.tsx` - Pin placement component (basic stub for future).
- [ ] Create `useMapInteraction.ts` - Shared hook for map state management.
- [ ] Add Storybook stories for each component (if Storybook configured).

## Acceptance Criteria

- [ ] `InteractiveMap` renders TopoJSON maps with correct projection.
- [ ] `RegionSelector` allows clicking/tapping regions to select/deselect.
- [ ] `MapControls` zoom/pan works on desktop and mobile.
- [ ] Components are TypeScript typed and follow project conventions.
- [ ] Bundle size impact documented (target: <70KB added).
- [ ] Components work on Chrome, Safari, Firefox (latest versions).

## Testing

- [ ] Unit tests: Test region selection state management.
- [ ] Visual tests: Render maps with different projections/data.
- [ ] Manual: Test on mobile devices (iOS Safari, Android Chrome).
- [ ] Manual: Test keyboard navigation (if supported).
