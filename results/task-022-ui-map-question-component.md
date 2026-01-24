Map question UI is now wired into gameplay with region selection, text input mode, and correctness handling in the session flow. The renderer now supports the new type, and map answers are validated in `useGameSession` so feedback and scoring follow existing patterns.

Details:
- Added a dedicated map question UI with map asset rendering, selectable regions, and text input mode, plus accessible buttons and feedback styling in `src/components/questions/MapQuestion.tsx`.
- Wired map questions into the switch renderer in `src/components/questions/QuestionRenderer.tsx`.
- Implemented map answer checking (single, multi, text) with lenient text matching in `src/hooks/useGameSession.ts`.

Next steps:
1. Manually play a geography set with a map question to confirm selection, feedback, and submit flow.
