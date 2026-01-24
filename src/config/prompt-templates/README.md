# Prompt Templates

This directory contains AI prompt templates for question generation.

## Structure
- `core/` - Shared prompt modules (format, topic tagging, flashcard rules, distributions)
- `types/` - Subject-type-specific rules (language, math, written, skills, concepts)
- `subjects/` - Grade-specific curriculum content per subject
- `metadata/` - Difficulty instructions and supporting metadata
- `skills/` - Skill taxonomies for each subject type

## Editing Templates
1. Edit .txt files directly
2. Use {{variable}} syntax for placeholders
3. Test changes by running the app locally
4. See /Prompt-separation-plan.md for full documentation

## Variable Substitution
Variables are provided by PromptBuilder and substituted by PromptLoader.

## Map Questions (Geography-Specific)

Map questions are ONLY available for geography quiz generation. The AI automatically:
- Loads `subjects/geography-map.txt` when generating geography quiz questions
- Enforces 100% map questions for geography (no other question types allowed)
- Uses available maps: `world-110m`, `europe-50m`, `finland-regions-10m`
- Enforces geography-only constraint (other subjects cannot use map questions)

**Note:** Geography distributions are map-only in `core/grade-distributions.json`,
and `PromptBuilder.ts` safeguards this via `applyGeographyMapDistribution()`.
