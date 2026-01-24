Added new schema fields for subject context and per-question subtopics, then wired them through the type layer, AI validation/mapping, and write paths so newly generated/extended/ingested questions persist `subtopic` and sets persist `subject_type`. The database migration is in place and applied.

Details
- Added Supabase migration for `question_sets.subject_type` and `questions.subtopic` in `supabase/migrations/20250207_add_subject_type_and_question_subtopic.sql`.
- Extended domain/database types to include `subject_type` and `subtopic` in `src/types/questions.ts` and `src/types/database.ts`.
- Propagated `subtopic` from AI validation to persisted questions in `src/lib/validation/schemas.ts`, `src/lib/ai/questionGenerator.ts`, `src/lib/supabase/write-queries.ts`, `src/app/api/extend-question-set/route.ts`, and `src/app/api/question-sets/submit/route.ts`.
- Persisted `subject_type` on question sets during generation in `src/app/api/generate-questions/route.ts`.
- Documented the schema additions in `DWF/adr/ADR-001-core-architecture.md`.
- Added an integration test (skips without Supabase env) in `tests/question-set-persistence.test.ts`.

Tests
- `npm test` (fails): module alias resolution error in `src/lib/questions/sequential-utils.ts` when running `tests/sequential-items.test.ts` (`ERR_MODULE_NOT_FOUND` for `@/types`). The new persistence test is skipped due to missing Supabase env vars.

Next steps
1) If you want tests to pass locally, I can update the test loader to resolve `@/` aliases.
2) If you want the persistence test to run, set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for a dev project.
