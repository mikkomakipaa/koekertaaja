# Task: Reorganize results screen layout

## Context

- Why this is needed: Current results screen is too long with all content in one vertical column. New tabbed layout with metric cards will reduce scrolling by ~50% and improve information hierarchy.
- Related docs/links: Part of Simplify Results Screen improvement, depends on task-077 and task-078, reference DWF/USER_JOURNEYS.md
- Related files:
  - `src/components/results/ResultsScreen.tsx` - Main refactor

## Scope

- In scope:
  - Restructure with hero section (celebration emoji + message)
  - Add 4 MetricCards in grid (score, streak, badges, personal best)
  - Move topic mastery to Overview tab
  - Move answer list to Answers tab with filter toggle
  - Move badge grid to Badges tab
  - Keep action buttons visible at bottom
  - Reduce page length

- Out of scope:
  - New features or data points
  - Results animation
  - Share/export functionality

## Changes

- [ ] Refactor ResultsScreen.tsx layout structure
- [ ] Create hero section with celebration emoji and message
- [ ] Add MetricCard grid with 4 cards (grid-cols-2 md:grid-cols-4)
- [ ] Move TopicMasteryDisplay to Overview tab
- [ ] Move answer list to Answers tab
- [ ] Add filter toggle (all/mistakes) in Answers tab
- [ ] Move badge grid to Badges tab with new/all sections
- [ ] Keep action buttons (Play Again, Back to Menu) always visible
- [ ] Remove long vertical scroll

## Acceptance Criteria

- [ ] Results screen uses new tabbed layout from task-077
- [ ] Hero section shows celebration emoji + message at top
- [ ] 4 MetricCards display key metrics (score %, streak, new badges, personal best)
- [ ] Overview tab contains topic mastery + review mistakes card
- [ ] Answers tab contains answer list with all/mistakes filter
- [ ] Badges tab separates new badges and all badges sections
- [ ] Action buttons visible at bottom without scrolling
- [ ] All existing functionality preserved (no regressions)
- [ ] Page length reduced by approximately 50%
- [ ] Mobile-responsive (grid adapts to 2 cols)

## Testing

- [ ] Tests to run:
  - Complete quiz, verify new layout renders
  - Check each tab contains expected content
  - Verify all metrics display correctly
  - Test filter toggle in Answers tab
  - Test on mobile viewport
  - Verify action buttons always visible

- [ ] New/updated tests:
  - Snapshot test for new layout
  - Test tab content organization
  - Verify no missing data from old layout
