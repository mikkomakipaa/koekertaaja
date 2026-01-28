# Task: Admin review section for flagged questions

## Context

- Admins need visibility of flagged questions and ability to edit content.
- Create page already has admin sections for managing question sets.
- Requirements: show flag count and allow editing question + acceptable answers (and correct answers/options for all types).
- Related files:
  - src/app/create/page.tsx
  - src/app/api/
  - src/lib/supabase/queries.ts or new admin-only query
  - src/types/

## Scope

- In scope:
  - Admin-only section listing flagged questions with counts.
  - Admin edit UI for question text and answers/options.
  - API route(s) for loading flagged questions and saving edits.
- Out of scope:
  - Non-admin visibility.

## Changes

- [ ] Add admin API: `GET /api/question-flags/manage` returning flagged questions with counts and question data.
- [ ] Add admin API: `PATCH /api/questions/:id` (or similar) for editing question_text + correct_answer + options (+ acceptable answers).
  - Use `requireAdmin()`.
  - Validate payload by question type.
- [ ] Create page: add new section “Ilmoitetut kysymykset” for admins.
  - Show question set, question text, flag count.
  - Provide edit form/modal.

## Acceptance Criteria

- [ ] Admins can view flagged questions with accurate counts.
- [ ] Admins can edit question text and answers/options and save.
- [ ] Non-admins cannot access manage APIs.

## Testing

- [ ] Manual: admin loads flagged list on `/create`.
- [ ] Manual: edit a flagged question and verify changes in play mode.
