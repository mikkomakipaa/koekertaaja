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

## Intent-Critical Contracts
- Keep output contracts provider-neutral and deterministic (JSON-only where required).
- Do not remove required fields (`topic`, `skill`, schema fields used by validators).
- Preserve pedagogical intent: grade-appropriate difficulty, curriculum alignment, meaningful explanations.
