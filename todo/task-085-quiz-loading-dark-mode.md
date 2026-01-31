# Task: Fix quiz loading screen dark mode support

## Context

- Why this is needed: Loading/spinner screens likely have fixed background colors that don't respect dark mode theme, causing jarring white flashes when using dark mode.
- Related docs/links: Reference DWF/DESIGN_SYSTEM.md for dark mode colors
- Related files:
  - `src/components/ui/loading.tsx` or similar loading component
  - `src/components/questions/QuestionRenderer.tsx` - Suspense fallback
  - Any other loading states in quiz flow

## Scope

- In scope:
  - Update loading screen background for dark mode
  - Update spinner color for dark mode visibility
  - Ensure loading text is readable in both themes
  - Match overall dark mode theme colors
  - Apply to all quiz-related loading states

- Out of scope:
  - Loading state animations
  - Loading progress indicators
  - Loading time optimization

## Changes

- [ ] Find all loading/spinner components used in quiz flow
- [ ] Add dark mode background: bg-gray-50 dark:bg-gray-900
- [ ] Update spinner border color: border-indigo-600 dark:border-indigo-400
- [ ] Update loading text: text-gray-600 dark:text-gray-400
- [ ] Ensure smooth transition when theme changes
- [ ] Check Suspense fallbacks in QuestionRenderer
- [ ] Verify no white flashes in dark mode

## Acceptance Criteria

- [ ] Loading screen background matches dark mode (dark:bg-gray-900)
- [ ] Spinner visible and properly colored in dark mode (dark:border-indigo-400)
- [ ] Loading text readable in both light and dark modes
- [ ] No flashing white background when loading in dark mode
- [ ] Smooth transition when theme changes
- [ ] Consistent with rest of app's dark theme (grays and indigo)
- [ ] All quiz loading states updated (question loading, session start, etc.)

## Testing

- [ ] Tests to run:
  - Enable dark mode, start quiz, verify loading screen is dark
  - Complete quiz, start new quiz, check for white flashes
  - Toggle dark mode while loading (if possible), verify smooth transition
  - Test on different browsers
  - Verify spinner visibility in dark mode

- [ ] New/updated tests:
  - Visual regression test for loading screen
  - Test dark mode class application
