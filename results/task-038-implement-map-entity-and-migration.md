Added the dedicated `map_questions` entity end to end: new table migration, typed database parsing, and CRUD helpers for both client reads and admin writes, plus a helper-driven integration test for create/read. This aligns the DB schema and TypeScript types with the documented map question schema while keeping writes server-only and reads safe for client usage.

- Migration and schema: `supabase/migrations/20260203_add_map_questions_table.sql` (table, indexes, RLS policy, updated_at trigger)
- Types and parsers: `src/types/questions.ts`, `src/types/database.ts` (MapQuestionEntity + DatabaseMapQuestion + parseDatabaseMapQuestion)
- Supabase helpers: `src/lib/supabase/queries.ts`, `src/lib/supabase/write-queries.ts`
- Test coverage: `tests/map-question-entity.test.ts`

Tests:
- `node --test --loader ./scripts/ts-node-loader.mjs tests/map-question-entity.test.ts` (skipped: missing Supabase env vars)

Next steps (optional):
1) Re-run the test with `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set.  
2) Run `npm run typecheck` to confirm types across the repo.
