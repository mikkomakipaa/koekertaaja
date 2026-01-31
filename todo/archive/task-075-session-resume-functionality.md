# Task: Implement session resume functionality

## Context

- Why this is needed: After detecting and displaying a paused session, users need to actually resume it from the exact point where they left off.
- Related docs/links: Part of Session Pause/Resume improvement, depends on task-073 and task-074
- Related files:
  - `src/hooks/useGameSession.ts` - Add resumeSession() function
  - `src/app/play/[code]/page.tsx` - Handle resume parameter

## Scope

- In scope:
  - Create resumeSession() function in useGameSession
  - Restore all state from SessionState object
  - Clear paused session from localStorage after successful resume
  - Handle ?resume=true URL parameter
  - Preserve original session startedAt timestamp

- Out of scope:
  - Multiple session support
  - Session validation (assume saved data is valid)
  - Session merging or conflict resolution

## Changes

- [ ] Add resumeSession() function to useGameSession hook
- [ ] Restore questions array from saved state
- [ ] Restore currentIndex to continue from same question
- [ ] Restore answers array with all previous answers
- [ ] Restore score, streak, and bestStreak
- [ ] Keep original startedAt timestamp (don't create new one)
- [ ] Clear 'paused_session' from localStorage after successful resume
- [ ] Add ?resume=true URL parameter handling in quiz page

## Acceptance Criteria

- [ ] resumeSession() loads all state from localStorage
- [ ] Quiz continues from exact question where student paused
- [ ] Score and streak values are preserved
- [ ] Previous answers are visible in session state
- [ ] No duplicate answers created
- [ ] Paused session cleared from localStorage after resume
- [ ] Works correctly across browser sessions
- [ ] Session timer uses original startedAt (not reset)

## Testing

- [ ] Tests to run:
  - Pause session after answering 5/15 questions
  - Resume session, verify continues at question 6
  - Verify score shows 5 questions already answered
  - Complete session, verify total answers = 15
  - Verify localStorage no longer contains paused session

- [ ] New/updated tests:
  - Unit test for resumeSession()
  - Integration test: pause → resume → complete session
  - Verify state restoration accuracy
