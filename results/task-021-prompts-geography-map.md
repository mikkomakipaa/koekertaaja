Wired geography-only map questions into the prompt system with a dedicated module and subject-gated distribution tweaks so map appears only for geography while other subjects stay unchanged. Updated the shared JSON format to include `map` plus clarified `options` shape, and added explicit “map only in geography” guardrails across type templates.

Details
- Added geography map instructions and example in `src/config/prompt-templates/subjects/geography-map.txt`, loaded only when the subject is geography in `src/lib/prompts/PromptBuilder.ts`.
- Adjusted quiz distributions at runtime for geography to include a small 5% `map` share (offset from `multiple_choice`) in `src/lib/prompts/PromptBuilder.ts`.
- Extended the base schema to include `map` and clarified `options` usage in `src/config/prompt-templates/core/format.txt`.
- Added a “map only in geography” rule to all type templates in `src/config/prompt-templates/types/concepts.txt`, `src/config/prompt-templates/types/skills.txt`, `src/config/prompt-templates/types/language.txt`, `src/config/prompt-templates/types/math.txt`, `src/config/prompt-templates/types/written.txt`.
- Added `maantiede` normalization to map to geography in `src/lib/prompts/PromptBuilder.ts`.

Next steps
1. Manually generate a geography question set and confirm at least one `map` question appears and non-geography subjects do not emit `map`.
