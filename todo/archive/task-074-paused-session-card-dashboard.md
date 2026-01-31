# Task: Display paused session card on dashboard

## Context

- Why this is needed: Users need a clear, prominent way to discover they have a paused session and resume it. Without this UI, saved sessions are invisible.
- Related docs/links: Part of Session Pause/Resume improvement, depends on task-073
- Related files:
  - `src/app/play/page.tsx` - Main dashboard/browse page
  - `src/hooks/useGameSession.ts` - For loading paused session

## Scope

- In scope:
  - Create paused session card component/section
  - Display session progress (X/Y questions answered)
  - Show time since paused using date-fns
  - Add "Jatka" (Resume) button
  - Add "Hylkää" (Discard) button with confirmation
  - Responsive design for mobile

- Out of scope:
  - Resume functionality (separate task)
  - Multiple paused sessions (only show most recent)
  - Session history tracking

## Changes

- [ ] Add paused session detection in /play page
- [ ] Create blue bordered card UI with session info
- [ ] Display progress indicator (questions answered/total)
- [ ] Format time with formatDistanceToNow from date-fns
- [ ] Add Resume button (navigation only, actual resume in next task)
- [ ] Add Discard button with confirmation dialog
- [ ] Position card prominently at top of page before topic selection

## Acceptance Criteria

- [ ] Card only appears if localStorage contains 'paused_session'
- [ ] Shows "X / Y kysymystä vastattu" progress
- [ ] Shows "Keskeytetty X sitten" time
- [ ] 📌 icon displayed
- [ ] Blue border (border-blue-500) and blue background (bg-blue-50 dark:bg-blue-900/20)
- [ ] Resume button navigates to quiz page
- [ ] Discard button clears localStorage after confirmation
- [ ] Card responsive on mobile (stacks buttons vertically)
- [ ] Card appears above mode toggle and topic cards

## Testing

- [ ] Tests to run:
  - Pause a session, navigate to /play, verify card appears
  - Click Discard, verify confirmation appears
  - Confirm discard, verify card disappears
  - Verify time formatting updates correctly

- [ ] New/updated tests:
  - Snapshot test for paused session card
  - Test card visibility based on localStorage
