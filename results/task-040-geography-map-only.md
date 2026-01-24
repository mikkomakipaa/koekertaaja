Locked geography to map-only end-to-end: prompts now forbid non-map types, distributions are 100% map, and server-side validation rejects any non-map geography output.

Details:
- Enforced map-only instructions and simplified geography question rules in `src/config/prompt-templates/types/geography.txt`.
- Updated map prompt constraints to require all geography questions be map type in `src/config/prompt-templates/subjects/geography-map.txt`.
- Set geography distributions to `map: 100` for all grades/modes in `src/config/prompt-templates/core/grade-distributions.json` and hard-enforced in `src/lib/prompts/PromptBuilder.ts`.
- Added server-side rejection of non-map geography questions in `src/lib/ai/questionGenerator.ts`.
- Reflected new map-only policy in prompt docs at `src/config/prompt-templates/README.md` and `docs/MAP_PROMPT_UPDATE_SUMMARY.md`.

Tests not run (manual requested).

Next steps:
1. Manually generate a geography set and confirm every question has `type: map`.
2. Optionally run `npm run typecheck` if you want a quick sanity check.
