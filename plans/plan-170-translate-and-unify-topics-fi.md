# Plan: Translate and unify question set topics to Finnish

## Goal

Eliminate mixed English/Finnish topic labels in stored question data and in mastery UI so each concept is represented by one canonical Finnish label.

## Current findings (Supabase MCP, 2026-02-27)

- `public.questions` has 906 rows; `public.question_sets` has 28 rows.
- `questions.topic` is mostly Finnish in current dev data, but UI evidence shows mixed labels in real usage.
- `questions.subtopic` contains many English values (for example `object pronouns`, `clothing vocabulary`, `Present Simple ...` variants), which indicates normalization is incomplete.

## Ordered execution plan

1. `task-213`: Define canonical Finnish topic normalization contract and shared mapping utilities.
2. `task-214`: Backfill existing Supabase data with idempotent SQL migration (via MCP).
3. `task-215`: Enforce normalization in generation + submit + write paths so new data cannot regress.
4. `task-216`: Merge legacy mastery stats by canonical topic key and display Finnish labels only.
5. `task-217`: Add regression tests and update DWF/docs and rollout checklist.

## Dependencies

- `task-214` depends on `task-213`.
- `task-215` depends on `task-213` and should run before `task-216` to stop new drift.
- `task-216` depends on `task-213` and benefits from `task-214`.
- `task-217` depends on all prior tasks.

