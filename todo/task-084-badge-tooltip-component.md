# Task: Implement badge tooltip component

## Context

- Why this is needed: With unlock conditions data available (task-083), we need UI to display them. Tooltips on hover/tap provide contextual help without cluttering the interface.
- Related docs/links: Part of Badge Tooltips improvement, depends on task-083, reference DWF/DESIGN_SYSTEM.md
- Related files:
  - `src/components/badges/BadgeDisplay.tsx` - Update or create component
  - Install @radix-ui/react-tooltip if needed

## Scope

- In scope:
  - Install and configure Radix UI Tooltip
  - Wrap badge display with Tooltip.Root
  - Show badge name, description, and unlock conditions in tooltip
  - Display unlock conditions only for locked badges
  - Show unlock date for unlocked badges
  - Dark tooltip styling
  - Mobile support (tap to show)

- Out of scope:
  - Badge animations
  - Progress bars toward unlock
  - Multi-badge tooltips

## Changes

- [ ] Install @radix-ui/react-tooltip if not present
- [ ] Import Tooltip components (Provider, Root, Trigger, Portal, Content, Arrow)
- [ ] Wrap badge component in Tooltip.Root
- [ ] Set Tooltip.Trigger to badge icon/card
- [ ] Create Tooltip.Content with dark background (bg-gray-900)
- [ ] Display badge name (font-semibold)
- [ ] Display description (text-sm text-gray-300)
- [ ] For locked badges: show "Avaa kun:" header + bulleted list of conditions
- [ ] For unlocked badges: show unlock date
- [ ] Add Arrow component pointing to badge
- [ ] Set max width 320px (max-w-xs)
- [ ] Set z-index: 50

## Acceptance Criteria

- [ ] Tooltip shows on hover (desktop) and tap (mobile)
- [ ] Locked badges display unlock conditions with "Avaa kun:" header
- [ ] Unlocked badges show "Avattu [date]" instead of conditions
- [ ] Conditions displayed as bulleted list (emerald bullet points)
- [ ] Tooltip content: badge name + description + conditions/date
- [ ] Dark tooltip: bg-gray-900 dark:bg-gray-800, white text
- [ ] Arrow points to badge
- [ ] Max width 320px, proper padding (px-4 py-3)
- [ ] Positioned correctly (sideOffset: 5)
- [ ] Works on mobile touch
- [ ] Accessible with proper ARIA labels

## Testing

- [ ] Tests to run:
  - Hover over locked badge, verify tooltip shows conditions
  - Hover over unlocked badge, verify shows unlock date
  - Tap badge on mobile, verify tooltip appears
  - Test tooltip positioning (doesn't overflow screen)
  - Test in dark mode

- [ ] New/updated tests:
  - Component test for tooltip rendering
  - Test locked vs unlocked badge content
  - Test accessibility (ARIA attributes)
