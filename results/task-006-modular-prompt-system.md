Implemented modular prompt assembly with core/type/subject modules, consolidated grade distributions, and rewired prompt loading to assemble prompts from modules; removed legacy monolithic templates and updated the prompt-template README to the new structure.

Details:
- Core/type/subject modules added in `src/config/prompt-templates/core/format.txt`, `src/config/prompt-templates/core/topic-tagging.txt`, `src/config/prompt-templates/core/flashcard-rules.txt`, `src/config/prompt-templates/types/language.txt`, `src/config/prompt-templates/types/math.txt`, `src/config/prompt-templates/types/written.txt`, `src/config/prompt-templates/types/skills.txt`, `src/config/prompt-templates/types/concepts.txt`, and curriculum JSONs under `src/config/prompt-templates/subjects/`.
- Consolidated distributions in `src/config/prompt-templates/core/grade-distributions.json` and updated `src/lib/prompts/PromptBuilder.ts` to assemble prompts by module order, load curricula, and render distributions with caching.
- Updated module loading/caching and path validation in `src/lib/prompts/PromptLoader.ts`, and switched prompt assembly in `src/lib/ai/questionGenerator.ts` to use `assemblePrompt`.
- Legacy templates and distribution metadata deleted from `src/config/prompt-templates/quiz/` and `src/config/prompt-templates/flashcard/`, plus old distribution JSONs in `src/config/prompt-templates/metadata/`.

Tests not run.

Note: I noticed unrelated pre-existing changes in the worktree (e.g. `.env.example`, `package.json`, `src/app/play/[code]/page.tsx`). How would you like me to handle those in future tasks?

Next steps:
1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. Manually generate English/Math/History/Art/Religion quiz + flashcard to validate output and measure token reduction.
