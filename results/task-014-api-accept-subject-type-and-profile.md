Enabled `subjectType` to flow from request validation through prompt assembly so custom subjects can use an explicit classification without breaking existing clients. The API now reads and validates `subjectType`, passes it into `generateQuestions`, and `PromptBuilder` prefers the provided type over inference. I also added a schema test to cover valid/invalid/missing `subjectType`, plus a type update on request payloads.

Changes are in:
- `src/lib/validation/schemas.ts`
- `src/lib/prompts/PromptBuilder.ts`
- `src/lib/ai/questionGenerator.ts`
- `src/app/api/generate-questions/route.ts`
- `src/types/questions.ts`
- `tests/create-question-set-schema.test.ts`

Tests:
- `npm test` (fails due to existing module resolution error in `tests/sequential-items.test.ts`: `ERR_MODULE_NOT_FOUND` for `@/types` from `src/lib/questions/sequential-utils.ts`). The new `createQuestionSetSchema` tests pass.

Next steps:
1) If you want, I can fix the existing test module resolution issue so `npm test` is green again.
2) If you want API-level coverage, I can add a route test that asserts 400/200 on invalid/valid `subjectType`.
