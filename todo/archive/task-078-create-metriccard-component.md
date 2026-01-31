# Task: Create MetricCard component for results

## Context

- Why this is needed: Key metrics (score, streak, badges, personal best) should be displayed prominently in a consistent, scannable format rather than scattered text.
- Related docs/links: Part of Simplify Results Screen improvement, reference DWF/DESIGN_SYSTEM.md
- Related files:
  - `src/components/ui/metric-card.tsx` - New component
  - `src/components/results/ResultsScreen.tsx` - Usage

## Scope

- In scope:
  - Create MetricCard component in ui folder
  - Support icon, label, value, optional percentage props
  - White card with shadow and border
  - Dark mode support
  - Responsive grid layout (2 cols mobile, 4 cols desktop)

- Out of scope:
  - Animations or transitions
  - Click interactions
  - Trend indicators (arrows)

## Changes

- [ ] Create src/components/ui/metric-card.tsx
- [ ] Define MetricCardProps interface (icon, label, value, percentage?)
- [ ] Implement card layout with icon + label at top
- [ ] Large bold value in center
- [ ] Optional percentage below value
- [ ] Add dark mode styles (dark:bg-gray-800, dark:border-gray-700)
- [ ] Export component from ui folder

## Acceptance Criteria

- [ ] Component exported from src/components/ui/metric-card.tsx
- [ ] Props: icon (ReactNode), label (string), value (string | number), percentage (optional number)
- [ ] Icon and label displayed at top with small gray text
- [ ] Value displayed large and bold (text-2xl font-bold)
- [ ] Percentage shown below value if provided (text-sm text-gray-600)
- [ ] White background with shadow-sm and border
- [ ] Dark mode: dark:bg-gray-800, dark:border-gray-700, dark:text-gray-100
- [ ] TypeScript types properly defined
- [ ] Component responsive on all screen sizes

## Testing

- [ ] Tests to run:
  - Render with all props, verify layout
  - Render without percentage, verify no percentage shown
  - Test dark mode styles
  - Test in grid layout (2 cols, 4 cols)

- [ ] New/updated tests:
  - Component snapshot test
  - Props validation test
  - Dark mode rendering test
