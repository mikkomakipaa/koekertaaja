Hook answer checking now funnels through a new shared evaluator so map answer rules are testable, and the unit tests cover valid/invalid map schemas plus map answer correctness scenarios. I also updated the test loader to resolve `@/` imports so existing and new tests run under `node --test`.

Details:
- Centralized answer evaluation in `src/lib/questions/answer-evaluation.ts` and wired `src/hooks/useGameSession.ts` to use it.
- Added map fixtures in `tests/fixtures/map-questions.ts` and new tests in `tests/map-question-schema.test.ts` plus `tests/map-answer-evaluation.test.ts`.
- Enabled `@/` alias resolution for tests in `scripts/ts-node-loader.mjs`.

Tests:
- `npm test` (passes; node emits the existing experimental loader warning).

If you want, I can also add a focused test script alias like `test:unit` to match the task wording.
