# Task: Define Map question data schema and assets

## Context

- New question type "map" is needed for geography only.
- Map questions require a base map and a way to mark/select regions.

## Scope

- In scope:
  - Define the JSON shape for map questions (stored in existing JSONB fields).
  - Decide how map assets are referenced (public asset path or URL).
  - Define answer format (single region id, multiple, or text input).
- Out of scope:
  - UI rendering or prompt updates.

## Changes

- [ ] Specify `map` question payload shape (e.g., `options` contains `mapAsset`, `regions[]`, `inputMode`).
- [ ] Specify `correct_answer` shape for map questions.
- [ ] Add asset placement plan (`public/maps/...`) and naming conventions.
- [ ] Document schema in `docs/API_SCHEMAS.md` (or new map section).

## Acceptance Criteria

- [ ] Map question schema is documented with example JSON.
- [ ] Asset referencing approach is defined and consistent with existing storage rules.
- [ ] Geography-only constraint is explicitly stated.

## Testing

- [ ] None (schema definition only).
