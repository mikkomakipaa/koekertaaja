STATUS: success
SUMMARY: Implemented review-mistakes storage hook, review-mode session flow, and UI buttons/indicators across browse, play, and results. Added unit tests for storage helpers and documented the feature in `AGENTS.md`.
CHANGED FILES:
- AGENTS.md
- src/hooks/useReviewMistakes.ts
- src/hooks/useGameSession.ts
- src/app/play/page.tsx
- src/app/play/[code]/page.tsx
- src/components/play/ResultsScreen.tsx
- tests/hooks/useReviewMistakes.test.ts
TESTS:
- node --test --loader ./scripts/ts-node-loader.mjs tests/hooks/useReviewMistakes.test.ts — PASS (warning about experimental loader)
NEW TASKS:
- none
ASSUMPTIONS/BLOCKERS:
- none
