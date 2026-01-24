Added explicit sequential year support by normalizing items to `{ text, year? }`, validating year ranges, and storing/reading the new JSONB shape so legacy string arrays still work. Parsing and rendering now normalize both formats, and unit tests cover schema validation and DB parsing.

Details:
- Sequential item typing + guards for legacy string arrays in `src/types/questions.ts`.
- Zod schema accepts both formats and enforces 1000–3000 year bounds in `src/lib/validation/schemas.ts`.
- Normalization applied during AI parsing, DB writes, and DB reads in `src/lib/ai/questionGenerator.ts`, `src/lib/supabase/write-queries.ts`, `src/types/database.ts`.
- UI normalization to keep legacy questions rendering in `src/components/questions/SequentialQuestion.tsx`.
- Added TS-aware test runner loader and unit tests in `scripts/ts-node-loader.mjs` and `tests/sequential-items.test.ts`, wired via `package.json`.

Tests:
- `npm run typecheck`
- `npm test` (passes; Node emits an `ExperimentalWarning` about the loader flag)

Next steps (if you want):
1) Run the manual creation/load checks from the task acceptance criteria to verify year display expectations.
