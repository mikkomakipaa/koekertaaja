Added a comprehensive question-type fixture set and wired tests to reuse it, with a dedicated fixture validation test to guarantee schema and parser coverage. The fixtures live in `tests/fixtures/question-types.ts`, map fixtures now re-export from `tests/fixtures/map-questions.ts`, and related tests were updated to pull from the shared fixtures in `tests/ai-question-map.test.ts`, `tests/map-question-schema.test.ts`, `tests/map-question-ideal.test.ts`, `tests/map-answer-evaluation.test.ts`, `tests/sequential-items.test.ts`, and `tests/topic-subtopic-validation.test.ts`. Fixture validation is covered in `tests/fixtures/question-types.test.ts`.

Tests:
- `npm run test`
