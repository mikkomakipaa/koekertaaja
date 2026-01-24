Added timeline-capable sequential examples and usage guidance to the prompt modules that assemble quiz templates, plus updated the shared JSON response format to show both `items` styles. This keeps existing standard sequential examples intact while introducing year-based timelines across language, math, and general subjects.

Details:
- Inserted timeline examples (literature + historical fiction) and timeline/standard guidance in `src/config/prompt-templates/types/language.txt`.
- Added math history/number system timelines and timeline/standard guidance in `src/config/prompt-templates/types/math.txt`.
- Added history, inventions, and life-cycle timelines plus guidance in `src/config/prompt-templates/types/concepts.txt`.
- Documented both sequential `items` formats (strings and `{text, year}`) in `src/config/prompt-templates/core/format.txt`.

Tests not run.

Next steps if you want me to verify behavior:
1) Run a few prompt generations for English/Math/Generic and confirm `year` appears only for timeline topics.
2) Spot-check year ranges and ordering in generated sequential questions.
