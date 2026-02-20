# Plan 169: Extend Model Selection to Laajenna

## Goal
Enable the same provider/model-selection behavior used in "Luo uusi" for the "Laajenna" flow so users can choose `Claude` or `OpenAI` when extending an existing question set.

## Current State
- `src/app/create/page.tsx` has a provider selector and stores `providerPreference`.
- Create flows append `provider` to `FormData`.
- `src/app/api/extend-question-set/route.ts` does not parse or validate `provider`.
- Extend route calls `identifyTopics()` and `generateQuestions()` without `targetProvider`.

## Proposed Scope
1. Add provider selection UI parity to `Laajenna` tab.
2. Send `provider` from extend submit payload.
3. Parse and validate provider server-side in extend API.
4. Pass `targetProvider` to both topic identification and question generation in extend API.
5. Add route/unit tests for provider parsing, validation, and forwarding behavior.
6. Update DWF docs to reflect provider selection support in extend flow.

## Risks
- OpenAI selected without `OPENAI_API_KEY` should fail early with localized 400 error.
- Extend flow currently has no direct tests; adding focused API tests is necessary to avoid regressions.

## Validation Plan
- Typecheck: `npm run typecheck`
- New/updated tests:
  - extend API provider validation and forwarding
  - optional UI smoke assertion for extend provider selector presence
