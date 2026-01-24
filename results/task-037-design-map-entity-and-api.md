Updated the API documentation to define a dedicated `map_questions` entity, its relationship to `question_sets`, and a separate creation endpoint, while removing map questions from the general question set submission contract. The changes live in `docs/API_SCHEMAS.md` to keep the design and API surface in one place for implementers.

- Added a new Map Question Entity section with table schema, JSON schema, and explicit `question_set_id` relationship details in `docs/API_SCHEMAS.md`.
- Documented `POST /api/map-questions/submit` with request/response examples in `docs/API_SCHEMAS.md`.
- Clarified that map questions are not accepted in `/api/question-sets/submit` and removed map-specific fields from the general question schema in `docs/API_SCHEMAS.md`.
- Updated the map example payload to match the new map question contract in `docs/API_SCHEMAS.md`.

Next steps (optional):
1. I can extend the OpenAPI spec in `docs/API_SCHEMAS.md` to include `/map-questions/submit`.
2. I can draft a migration file for the `map_questions` table and RLS policies.
