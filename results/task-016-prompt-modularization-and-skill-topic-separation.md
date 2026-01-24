Tightened prompt templates to require topic + skill (optional subtopic) and clarified skill/topic separation per subject type so the assembled prompt is less ambiguous. Updated core prompt format and tagging rules in `src/config/prompt-templates/core/format.txt` and `src/config/prompt-templates/core/skill-tagging.txt`, added subtopic guidance in `src/config/prompt-templates/core/topic-tagging.txt`, and refined subject-type guidance in `src/config/prompt-templates/types/language.txt`, `src/config/prompt-templates/types/written.txt`, and `src/config/prompt-templates/types/math.txt` to keep topic as content area and skill as ability. Documented the optional `subtopic` and `skill` fields in the public schema in `docs/API_SCHEMAS.md` for consistency.

Tests not run.

Next steps:
1. Manually generate questions for one subject in each type (language, written, math) and verify each question includes `topic` + `skill` (and optional `subtopic`).
