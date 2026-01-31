# Task: Create tabbed results interface

## Context

- Why this is needed: Current results screen is overwhelming with all information shown at once, requiring extensive scrolling. Tabbed interface provides focused, organized information.
- Related docs/links: Part of Simplify Results Screen improvement (3 pts total), reference DWF/DESIGN_SYSTEM.md
- Related files:
  - `src/components/results/ResultsScreen.tsx` - Main results component
  - Install Radix UI Tabs if not already available

## Scope

- In scope:
  - Install and configure Radix UI Tabs component
  - Create three tabs: Yhteenveto (Overview), Vastaukset (Answers), Saavutukset (Badges)
  - Add icons to tab triggers
  - Set default tab to "overview"
  - Ensure keyboard navigation works (arrow keys)
  - Mobile-friendly tab layout

- Out of scope:
  - Content organization within tabs (separate task)
  - Tab state persistence
  - Analytics tracking for tab usage

## Changes

- [ ] Install @radix-ui/react-tabs if not present
- [ ] Import Tabs, TabsList, TabsTrigger, TabsContent
- [ ] Create TabsList with 3 triggers: Yhteenveto, Vastaukset, Saavutukset
- [ ] Add icons to triggers (BarChart, FileText, Award)
- [ ] Set defaultValue="overview"
- [ ] Add icon imports from Phosphor icons
- [ ] Style tabs to match design system (indigo theme)

## Acceptance Criteria

- [ ] Three tabs render correctly: Yhteenveto, Vastaukset, Saavutukset
- [ ] Default tab is "overview" (Yhteenveto)
- [ ] Tab content switches without page reload
- [ ] Icons displayed in tab triggers
- [ ] Keyboard navigation works (left/right arrows switch tabs)
- [ ] Mobile layout displays tabs horizontally scrollable or stacked
- [ ] Tab styling matches design system (indigo-600 for active)
- [ ] Smooth transition between tabs

## Testing

- [ ] Tests to run:
  - Complete quiz, verify results screen shows tabs
  - Click each tab, verify content switches
  - Use keyboard arrows, verify navigation works
  - Test on mobile viewport
  - Verify default tab is overview

- [ ] New/updated tests:
  - Component test for Tabs rendering
  - Test keyboard navigation
  - Test tab switching behavior
