Locked map questions to the inline geography quiz flow and documented the decision so routing is explicit and predictable. Prompt assembly now includes map rules only for geography in quiz mode, and the architecture decision spells out why we’re not adding a dedicated profile yet.

Details:
- Added geography-quiz-only map rule inclusion in `src/lib/prompts/PromptBuilder.ts`.
- Clarified map triggering rules in `src/config/prompt-templates/README.md`.
- Recorded the inline integration decision and trigger conditions in `DWF/CORE_ARCHITECTURE.md`.

Tests not run (manual check noted in task).

Next steps:
1. Manually verify geography quiz generation includes map questions while other subjects and flashcards do not.
