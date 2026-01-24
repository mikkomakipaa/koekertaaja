Added explicit geography-only handling for map questions, updated prompts to require at least one map item for geography, and added a runtime warning when a geography set has zero map questions. Non‑geography map outputs are now filtered with warnings in the generator.

Details:
- Enforced geography map requirement and clarified map schema fields in `src/config/prompt-templates/subjects/geography-map.txt`.
- Strengthened “map is geography-only” guidance across type templates in `src/config/prompt-templates/types/written.txt`, `src/config/prompt-templates/types/math.txt`, `src/config/prompt-templates/types/language.txt`, `src/config/prompt-templates/types/skills.txt`, `src/config/prompt-templates/types/concepts.txt`.
- Added runtime filtering + warning for non‑geography map questions and a geography zero‑map warning in `src/lib/ai/questionGenerator.ts`.

Next steps:
1) Manually generate a geography set and confirm at least one `map` question appears.
