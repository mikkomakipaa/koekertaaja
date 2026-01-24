Added a dedicated question-type schema test suite that validates each fixture and asserts per-type failures for missing or invalid required fields, aligning coverage with the aiQuestionSchema rules. New tests live in `tests/question-type-schema.test.ts`, using `tests/fixtures/question-types.ts` for positives and targeted negatives (options, pairs, correct_answer, sequential order, and map regions).

Tests:
- `npm run test:unit` (failed: missing script `test:unit`)

Next steps:
1) Run `npm run test` to execute the unit tests.
2) If you want to keep the task’s command, add a `test:unit` alias in `package.json` (e.g., pointing to `npm run test`).
