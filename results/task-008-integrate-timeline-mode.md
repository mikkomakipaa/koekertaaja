Integrated timeline mode into sequential questions by normalizing items in a shared helper, auto-selecting list vs timeline based on year data, and wiring a single order-change handler so both views share the same state and feedback behavior. Updated the correct-order fallback to include years when present, and added unit coverage for normalization and mode detection. Changes are in `src/components/questions/SequentialQuestion.tsx`, `src/lib/questions/sequential-utils.ts`, and `tests/sequential-items.test.ts`.

Tests:
- `npm run typecheck`

Next steps (optional):
1. `npm test` to run the new unit tests.
2. Manually verify list and timeline flows per the acceptance checklist.
