# Task: Save session state to localStorage

## Context

- Why this is needed: Students lose all progress if they navigate away or accidentally close the browser during a quiz session. This creates frustration and discourages completing sessions.
- Related docs/links: Part of Session Pause/Resume improvement (8 pts total)
- Related files:
  - `src/hooks/useGameSession.ts` - Main game session state management
  - `src/app/play/[code]/page.tsx` - Quiz page component

## Scope

- In scope:
  - Create SessionState interface with all necessary quiz state
  - Implement saveSessionState() function
  - Implement loadSessionState() function
  - Implement clearSessionState() function
  - Save state automatically when navigating away
  - Handle browser refresh/close events

- Out of scope:
  - UI for displaying paused sessions (separate task)
  - Resume functionality (separate task)
  - Flashcard session pause (focus on quiz mode only)

## Changes

- [ ] Add SessionState interface to useGameSession.ts
- [ ] Implement state persistence functions (save/load/clear)
- [ ] Add beforeunload event handler to save on browser close
- [ ] Store in localStorage with key 'paused_session'
- [ ] Include pausedAt timestamp when saving
- [ ] Ensure TypeScript types are properly defined

## Acceptance Criteria

- [ ] SessionState interface includes: code, questions, currentIndex, answers, score, streak, bestStreak, startedAt, pausedAt
- [ ] State saves to localStorage when user navigates away from quiz
- [ ] State persists across browser sessions
- [ ] Old paused sessions are not overwritten (keeps most recent)
- [ ] All data is properly typed with TypeScript
- [ ] Browser close/refresh triggers state save

## Testing

- [ ] Tests to run:
  - Start quiz session, navigate away, verify localStorage contains session data
  - Close browser, reopen, verify localStorage persists
  - Start new session, verify old session is replaced

- [ ] New/updated tests:
  - Unit test for saveSessionState()
  - Unit test for loadSessionState()
  - Verify JSON serialization works correctly
