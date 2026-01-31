# Task: Enhance exit confirmation with pause messaging

## Context

- Why this is needed: Current exit confirmation doesn't inform users that their progress will be saved, leading to uncertainty and potential re-starting of sessions unnecessarily.
- Related docs/links: Part of Session Pause/Resume improvement, depends on task-073
- Related files:
  - `src/app/play/[code]/page.tsx` - Quiz page with exit handling
  - Navigation handlers (back button, home link)

## Scope

- In scope:
  - Update exit confirmation message to explain session will be saved
  - Automatically save session state before navigation
  - Handle back button, home link, and browser back button
  - Update pausedAt timestamp when saving

- Out of scope:
  - Custom modal dialog (use browser confirm for now)
  - Exit analytics tracking
  - "Don't ask again" option

## Changes

- [ ] Update confirm() message to: "Haluatko keskeyttää harjoituksen? Voit jatkaa myöhemmin siitä mihin jäit."
- [ ] Call saveSessionState() before allowing navigation
- [ ] Add pausedAt timestamp to saved session
- [ ] Handle browser back button with beforeunload event
- [ ] Handle explicit navigation (home link, back button)
- [ ] Clear any "session in progress" indicators

## Acceptance Criteria

- [ ] Exit confirmation shows new message about saving and resuming
- [ ] Session automatically saved on exit (no manual save needed)
- [ ] pausedAt timestamp added to session state
- [ ] Navigation allowed after confirmation
- [ ] Back button triggers confirmation
- [ ] Home/menu link triggers confirmation
- [ ] Browser back button saves session before unload
- [ ] No duplicate confirmations shown

## Testing

- [ ] Tests to run:
  - Click back button, verify confirmation appears
  - Confirm exit, verify localStorage contains session
  - Click home link, verify same behavior
  - Use browser back button, verify session saved
  - Verify new message text displays correctly

- [ ] New/updated tests:
  - Test exit confirmation message content
  - Test state save on navigation
  - Test beforeunload handler
