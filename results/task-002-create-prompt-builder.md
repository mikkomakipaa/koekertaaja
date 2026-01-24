Built a new `PromptBuilder` that loads/caches the prompt metadata JSON, formats distributions/topics/material sections, and assembles all template variables for both quiz and flashcard modes in one place. This centralizes the variable construction logic away from the templates and matches the existing prompt behavior while keeping it type-safe and reusable.

Details:
- Added `PromptBuilder` with metadata loading, formatting helpers, and `buildVariables` that returns a complete `Record<string, string>` for template substitution in `src/lib/prompts/PromptBuilder.ts`.
- Difficulty instructions now combine metadata text with formatted distribution blocks and subject-specific distribution notes; topics and material sections are consistently formatted.

Tests:
- `npm run typecheck`

Next steps:
1) Manually build variables for english/grade 5/helppo and inspect the output formatting.
2) Proceed to Task 003 to wire this into `questionGenerator.ts`.
