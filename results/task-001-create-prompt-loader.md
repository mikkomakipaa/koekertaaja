Implemented a filesystem-backed PromptLoader with subject/mode template mapping, variable substitution, and clear errors in `src/lib/prompts/PromptLoader.ts`. This centralizes prompt template loading and keeps prompt content separate from generation logic.

Details
- Added `PromptLoader` with `loadTemplate`, `substituteVariables`, and `buildPrompt` plus JSDoc in `src/lib/prompts/PromptLoader.ts`.
- Defined template path mapping and `PromptConfig`/`PromptTemplatePathMap` types in `src/lib/prompts/PromptLoader.ts`.
- Included subject normalization and informative errors for invalid subjects, missing variables, and missing templates in `src/lib/prompts/PromptLoader.ts`.

Tests not run (recommend)
- `npm run typecheck`
- Manual: load `src/config/prompt-templates/quiz/english-quiz.txt` and verify content
- Manual: substitute variables and verify output

Next steps
1) Run `npm run typecheck`
2) Do the two manual template/variable checks described in the task
