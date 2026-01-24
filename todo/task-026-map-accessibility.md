# Task: Map question accessibility - Keyboard navigation and screen readers

## Context

- Map questions must be accessible to users with disabilities (WCAG 2.1 AA compliance).
- Keyboard navigation required for users who cannot use mouse/touch.
- Screen reader support needed for vision-impaired users.
- Text-based fallback mode for users who cannot interact with maps.
- Related docs: `MAP_QUESTION_DESIGN_PROPOSAL.md`
- Related files: `src/components/questions/map/`

## Scope

- In scope:
  - Implement keyboard navigation for region selection (Arrow keys, Enter, Space, Escape).
  - Add ARIA labels and roles to SVG map elements.
  - Create text-based fallback mode (searchable dropdown or autocomplete).
  - Test with NVDA, JAWS, VoiceOver screen readers.
  - Add focus indicators and high-contrast mode support.
- Out of scope:
  - Braille display support (beyond standard screen reader compatibility).
  - Sign language video explanations.

## Changes

- [ ] Create `MapAccessibility.tsx` component for keyboard/SR support.
- [ ] Add `tabIndex`, `role`, `aria-label` to all interactive map elements.
- [ ] Implement keyboard event handlers (onKeyDown for arrow keys, Enter, Space).
- [ ] Create `TextFallbackMode.tsx` - Searchable region selector as alternative.
- [ ] Add focus styles (visible outline, high-contrast support).
- [ ] Document accessibility features in component JSDoc.
- [ ] Add accessibility testing checklist to PR template.

## Acceptance Criteria

- [ ] All map regions are keyboard-navigable (Tab, Arrow keys).
- [ ] Pressing Enter/Space selects/deselects a region.
- [ ] Screen readers announce region names and selection state.
- [ ] Text fallback mode is available via toggle button.
- [ ] Focus indicators are visible in all themes (light/dark/high-contrast).
- [ ] Passes axe DevTools automated accessibility scan (0 violations).
- [ ] Tested with VoiceOver (macOS/iOS) and NVDA (Windows).

## Testing

- [ ] Manual: Navigate map using only keyboard, verify all regions reachable.
- [ ] Manual: Test with VoiceOver and verify region announcements.
- [ ] Manual: Test with NVDA and verify ARIA labels read correctly.
- [ ] Automated: Run axe accessibility checker in Storybook/dev environment.
- [ ] Manual: Test high-contrast mode and dark mode.
- [ ] Manual: Test text fallback mode on all question types.
