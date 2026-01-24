Subject-type routing now drives template selection and metadata, with new written/skills/concepts prompts and distributions; English/Math stay on their original templates with language subjects defaulting to the written templates to avoid missing files. Updated routing logic lives in `src/lib/prompts/subjectTypeMapping.ts`, `src/lib/prompts/PromptBuilder.ts`, `src/lib/prompts/PromptLoader.ts`, and `src/lib/ai/questionGenerator.ts`, plus subject metadata in `src/config/subjects.ts`. New prompt files are in `src/config/prompt-templates/quiz/written-quiz.txt`, `src/config/prompt-templates/quiz/skills-quiz.txt`, `src/config/prompt-templates/quiz/concepts-quiz.txt`, `src/config/prompt-templates/flashcard/written-flashcard.txt`, `src/config/prompt-templates/flashcard/skills-flashcard.txt`, and `src/config/prompt-templates/flashcard/concepts-flashcard.txt`, with distributions in `src/config/prompt-templates/metadata/written-distributions.json`, `src/config/prompt-templates/metadata/skills-distributions.json`, and `src/config/prompt-templates/metadata/concepts-distributions.json`. Removed generic templates and distributions.

Tests run:
- `npm run typecheck`
- `npm run lint`

Next steps (manual checks):
1. Generate a History quiz and verify written patterns.
2. Generate an Art quiz and verify skills patterns.
3. Generate a Religion quiz and verify concepts patterns.
4. Generate English/Math quizzes to confirm original templates are used.
