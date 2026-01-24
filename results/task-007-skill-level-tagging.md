Skill tagging is now wired end‑to‑end: prompts include skill requirements + subject taxonomies, generated questions normalize/validate skill tags with coverage logging, question persistence includes the new `skill` column, and session sampling balances skills within topics with a topic‑only fallback when skill coverage is low. Prompt instructions were updated to explicitly forbid mixed skills per question and give skill examples for each subject type.

Changes landed in:
- Prompt assembly and taxonomy loading in `src/lib/prompts/PromptBuilder.ts`
- New skill taxonomies in `src/config/prompt-templates/skills/*.json` and tagging rules in `src/config/prompt-templates/core/skill-tagging.txt`
- Skill tagging guidance added to `src/config/prompt-templates/types/language.txt`, `src/config/prompt-templates/types/math.txt`, `src/config/prompt-templates/types/written.txt`, `src/config/prompt-templates/types/skills.txt`, `src/config/prompt-templates/types/concepts.txt`
- Skill normalization + coverage logging in `src/lib/ai/questionGenerator.ts`
- Skill-aware stratified sampling in `src/hooks/useGameSession.ts`
- Types and schemas in `src/types/questions.ts`, `src/types/database.ts`, `src/lib/validation/schemas.ts`
- Persistence updates in `src/lib/supabase/write-queries.ts`, `src/app/api/extend-question-set/route.ts`, `src/app/api/question-sets/submit/route.ts`
- Migration in `supabase/migrations/20250131_add_skill_to_questions.sql`

Next steps:
1) Apply the migration in dev (`supabase/migrations/20250131_add_skill_to_questions.sql`) and validate inserts with the new `skill` column.
2) Run `npm run typecheck` and `npm run lint`.
3) Manually generate quizzes for all 5 subject types and verify skill coverage + no mixed-skill questions in logs.

Tests not run here.
