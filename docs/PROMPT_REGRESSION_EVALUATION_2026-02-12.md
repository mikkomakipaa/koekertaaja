# Prompt Regression Evaluation and Safe Rollout (2026-02-12)

## Scope

This report compares `baseline_pre_refactor` vs `refactored_provider_neutral` prompts for both providers (`anthropic`, `openai`) across core flows:

- `topic_identification`
- `quiz_helppo`
- `quiz_normaali`
- `flashcard_vocabulary`
- `flashcard_grammar`

Dataset and checks:

- Dataset: `tests/fixtures/prompt-regression-evaluation.ts`
- Evaluator: `tests/fixtures/prompt-regression-evaluator.ts`
- Automated checks: `tests/prompt-regression-evaluation.test.ts`

## Evaluation Dataset

The fixed dataset uses representative Finnish school materials, subject/grade combinations, and expected qualitative outcomes for pedagogical intent:

- Math grade 6 topic identification (geometry + Pythagoras)
- Finnish grade 5 quiz, easy mode (sentence members)
- History grade 6 quiz, normal mode (Finnish independence)
- English grade 4 flashcards, vocabulary
- English grade 5 flashcards, grammar

Each scenario stores side-by-side baseline/refactored outputs for both providers and rubric scores:

- `schemaAdherence`
- `topicQuality`
- `pedagogicalQuality`
- `languageQuality`

Quality score formula (1-5):

- `(jsonValidityScore + schemaAdherence + topicQuality + pedagogicalQuality + languageQuality) / 5`

## Controlled Results (Side-by-Side)

### Reliability gates

- JSON failure rate: `0.00` (threshold <= `0.02`) -> PASS
- Minimum valid-question ratio thresholds:
  - topic identification: `1.0`
  - quiz flows: `0.7`
  - flashcard flows: `0.4`
- Refactored outputs met ratio gates in all scenarios/providers -> PASS

### Quality deltas (refactored - baseline)

- `topic-math-grade6`
  - Anthropic: `+0.08`
  - OpenAI: `+0.16`
- `quiz-finnish-grade5-helppo`
  - Anthropic: `+0.26`
  - OpenAI: `+0.12`
- `quiz-history-grade6-normaali`
  - Anthropic: `+0.28`
  - OpenAI: `+0.12`
- `flashcard-english-grade4-vocabulary`
  - Anthropic: `+0.22`
  - OpenAI: `+0.16`
- `flashcard-english-grade5-grammar`
  - Anthropic: `+0.08`
  - OpenAI: `+0.20`

All deltas are above rollback boundary `-0.2` -> PASS

### Provider parity

- Max refactored provider parity gap observed: `0.08`
- Threshold: <= `0.30`
- Result: PASS

## Tradeoffs Observed

- Refactored prompts improve contract reliability and explanation consistency across both providers.
- Baseline prompts showed more variance in explanation depth and occasional contract leakage in quiz/flashcard outputs.
- Refactored prompts are stricter, which lowers stylistic variation but better protects schema and pedagogical minima.

## Recommendation

Final decision: **PASS** for staged rollout of refactored prompts.

Reasoning:

- Reliability gates passed (JSON + valid-question ratio).
- Educational quality did not regress and improved in all measured scenarios.
- Provider parity remained within safe range for core flows.

## Rollout and Rollback Playbook

Use this task-level playbook in addition to `docs/PROVIDER_EVALUATION_AND_ROLLOUT.md`.

### Rollout gates

1. Dev shadow run
- Keep Anthropic primary.
- Run `npm test -- tests/prompt-regression-evaluation.test.ts`.
- Require zero hard-gate failures.

2. Staging shadow run
- Repeat regression test suite with latest prompt/model versions pinned.
- Require two consecutive green runs.

3. Limited production canary
- Route 5% provider canary only after staging pass.
- Increase 5% -> 10% -> 20% only if metrics stay inside thresholds.

### Rollback triggers (hard)

Rollback immediately for affected flow if any trigger fires:

- JSON failure rate > `2%` over two consecutive windows.
- Valid-question ratio falls below `0.70` for quiz flows.
- Quality score drop < `-0.20` vs approved baseline.
- Provider parity gap > `0.30`.

### Rollback actions

1. Set `AI_PROVIDER_PRIMARY=anthropic`.
2. Set `AI_PROVIDER_CANARY_PERCENT=0`.
3. Set `AI_PROVIDER_SHADOW_MODE=true` for diagnostics.
4. Re-run regression suite before any re-enable.

## Execution Log

Executed checks:

- `node --test --loader ./scripts/ts-node-loader.mjs tests/prompt-regression-evaluation.test.ts tests/fixtures/provider-quality-regression.test.ts`
- `npm run typecheck`

Both checks passed on 2026-02-12.
