Updated the AI question contract documentation so each type has a clear JSON shape, constraints, and a valid example that matches the current Zod validation. The shared schema now includes `topic` as required and supports map options directly, aligning with `src/lib/validation/schemas.ts` expectations.

- Added per-type contracts and examples in `docs/API_SCHEMAS.md`
- Updated the JSON Schema to include map questions, map options, and sequential item variants in `docs/API_SCHEMAS.md`

If you want this split into a dedicated `docs/QUESTION_TYPES.md`, say the word and I’ll move it.
