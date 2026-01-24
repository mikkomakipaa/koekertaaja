Added the `map` question type and its options/answers to the core type unions, DB parsing, and Supabase write mapping so map questions persist using the existing JSONB fields, and tightened validation to accept the map payload shape with inputMode-specific `correct_answer` rules. These updates live in `src/types/questions.ts`, `src/types/database.ts`, `src/lib/supabase/write-queries.ts`, and `src/lib/validation/schemas.ts`, with new coverage in `tests/ai-question-map.test.ts` and a persistence check in `tests/question-set-persistence.test.ts`.

Tests
- `npm test` (fails: `tests/sequential-items.test.ts` cannot resolve `@/types` from `src/lib/questions/sequential-utils.ts`; map persistence tests skipped due to missing Supabase env vars)

Next steps
1) Fix the `@` path alias resolution for Node tests (e.g., update the loader to honor `tsconfig` paths), then rerun `npm test`.
2) Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to run the persistence tests end-to-end.
