Added a shared Zod validator for `questionsToAdd` and wired it into the extend-question-set API so invalid values return a clear 400, plus a small unit test suite for the schema. The validation lives in `src/lib/validation/schemas.ts`, and the API now uses it in `src/app/api/extend-question-set/route.ts` to reject NaN/<=0/too-large inputs before any DB or AI work.

Tests:
- `npm test` (failed: `tests/sequential-items.test.ts` can’t resolve `@/types` via the loader; existing issue unrelated to this change)

Files touched:
- `src/lib/validation/schemas.ts`
- `src/app/api/extend-question-set/route.ts`
- `tests/extend-question-set-validation.test.ts`

Next steps:
1) If you want, I can adjust the test loader to resolve `@/` paths so `npm test` passes.
