# Task: Document question type contracts (schema + examples)

## Context

- Question generation is a black box right now.
- Need a clear, testable contract per question type before debugging UI behavior.

## Scope

- In scope:
  - Document required fields and JSON shape per question type.
  - Include at least one valid example per type (multiple_choice, fill_blank, true_false, short_answer, matching, sequential, map).
  - Reference validation rules (required/optional fields, constraints).
- Out of scope:
  - Prompt changes or UI changes.

## Changes

- [ ] Update `docs/API_SCHEMAS.md` (or create a new `docs/QUESTION_TYPES.md`) with a formal contract per type.
- [ ] Add example payloads for each type.
- [ ] Explicitly list map options fields and correct_answer shapes.

## Acceptance Criteria

- [ ] Each question type has a documented JSON contract and example.
- [ ] Contracts align with current Zod validation rules.

## Testing

- [ ] None (documentation only).
