Reworked the question-type schema tests to omit fields via destructuring so missing-field cases stay intact without `delete` on non-optional props, and added a narrow cast in the map question update path to satisfy Supabase’s current update typing. Updates are in `tests/question-type-schema.test.ts` and `src/lib/supabase/write-queries.ts`.

Tests: `scripts/test.sh`

If you want, I can also dig into why Supabase is typing `map_questions` updates as `never` and fix it at the type source.
