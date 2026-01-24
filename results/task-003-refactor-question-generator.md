Swapped the prompt selection in `src/lib/ai/questionGenerator.ts` to use `PromptLoader` + `PromptBuilder`, keeping the existing generation flow intact while adding template-load logging and error handling. The old prompt imports and branching logic are removed, and the new flow builds variables (including `materialText`, `identifiedTopics`, and `grade`) before loading the template-based prompt.

Details
- `src/lib/ai/questionGenerator.ts`: added prompt template subject normalization + loader/builder usage with logging and wrapped errors; removed legacy prompt imports.

Tests
- `npm run typecheck` (pass)
- `npm run lint` (fail: `Invalid project directory provided, no such directory: /Users/mikko.makipaa/koekertaaja/lint`)

Next steps (optional)
1) Manually generate english/quiz/helppo and math/flashcard to confirm prompts/logs.  
2) Investigate the lint failure (looks like a path/config issue rather than code).
