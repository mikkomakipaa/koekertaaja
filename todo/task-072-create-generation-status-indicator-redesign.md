# Task: Redesign creation status indicator for quiz + flashcard flow

## Context

- Why this is needed: Current creation status indicator should be replaced with a new design aligned to the separate API flow (topic recognition first, then applicable quiz sets and flashcards).
- Related docs/links: `Documentation/IMPLEMENTATION_PLAN.md` (if relevant), `Documentation/TESTING_GUIDE.md`.
- Related files: `src/app/create/page.tsx`, `src/components/create/CreationProgressStepper.tsx` (existing), API routes for generation (`src/app/api/generate-questions/*`).

## Scope

- In scope:
  - Replace current creation status indicator UI with a new design.
  - Reflect the new status flow: Topic recognition → Quiz set(s) generation → Flashcard generation (when applicable) → Save/complete.
  - Reuse existing component(s) if possible; otherwise add a new component in `src/components/create/`.
- Out of scope:
  - Changing generation logic, API contract, or backend response shape.
  - Reworking unrelated create page UI.

## Changes

- [ ] Audit current status indicator and how it is fed (state, response mapping, partial success).
- [ ] Design new indicator states aligned to API flow (topics first, then per-mode generation and save).
- [ ] Implement new indicator component or refactor `CreationProgressStepper` for new visuals.
- [ ] Wire state transitions in `src/app/create/page.tsx` to the new indicator.

## Acceptance Criteria

- [ ] New status indicator replaces the current one on the Create page.
- [ ] Status steps mirror the separate API flow: Topic recognition → applicable quiz sets → flashcards → completion.
- [ ] Indicator handles partial success and shows failures gracefully.
- [ ] Visuals reuse existing component patterns when possible.

## Testing

- [ ] Tests to run: `npm run typecheck`.
- [ ] New/updated tests: Not required.
