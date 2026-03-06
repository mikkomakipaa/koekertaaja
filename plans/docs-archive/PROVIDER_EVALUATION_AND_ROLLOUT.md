# Provider Evaluation and Controlled Rollout

**Status**: Active operational runbook  
**Last updated**: 2026-02-12  
**Primary baseline provider**: Anthropic (Claude)  
**Candidate provider**: OpenAI

---

## Purpose

This document defines a repeatable way to evaluate Anthropic vs OpenAI per AI task in Koekertaaja and safely roll out changes without risking production continuity.

Claude remains the production baseline during all rollout phases. OpenAI is introduced only behind explicit feature flags and shadow traffic.

---

## Task Types and Go/No-Go Criteria

All criteria below are measured against the same prompt version and same regression dataset (`tests/fixtures/provider-quality-regression.ts`).

| Task type | JSON validity (hard gate) | Finnish grade-level clarity (hard gate) | Latency p95 | Token cost / success | Retry rate | Go / No-Go rule |
|---|---:|---:|---:|---:|---:|---|
| `topic_identification` | >= 99.0% | >= 4.3 / 5.0 | <= 4.0 s | <= 1.10x Claude | <= 2.0% | GO if all hard gates pass and at least 2 of 3 operational metrics improve or stay neutral |
| `flashcard_creation` | >= 98.5% | >= 4.4 / 5.0 | <= 6.0 s | <= 1.10x Claude | <= 3.0% | GO if hard gates pass and quality is non-inferior (+/- 0.1) with no operational regression |
| `question_generation` | >= 98.0% | >= 4.6 / 5.0 | <= 10.0 s | <= 1.20x Claude | <= 4.0% | GO only if quality improves by >= 0.2 and no hard gate fails |
| `visual_questions` | >= 97.5% | >= 4.5 / 5.0 | <= 12.0 s | <= 1.25x Claude | <= 4.0% | GO only after staging success and manual review sign-off |

### Metric definitions

- `JSON validity`: Share of responses that parse and validate against the task schema without manual repair.
- `Finnish grade-level clarity`: Human rubric score (1-5) for grade 4-6 readability, pedagogical clarity, and age-fit.
- `Latency p95`: End-to-end provider call latency at the 95th percentile.
- `Token cost / success`: Mean token cost for successful validated outputs.
- `Retry rate`: Share of requests requiring at least one retry due to transient provider failures.

Any hard-gate miss is an automatic no-go.

---

## Evaluation Checklist (Per Run)

Run this checklist for each task type and provider pair:

1. Pin prompt/template versions and model versions before the run.
2. Run the same fixture batch for both providers.
3. Record:
   - total requests
   - valid JSON count
   - Finnish clarity score average
   - latency p50/p95
   - input/output tokens and estimated cost
   - retry count and retry reasons
4. Compare against task go/no-go table.
5. Document decision with date, owner, and rollback plan.

Minimum sample sizes:

- `topic_identification`: 150 requests
- `flashcard_creation`: 150 requests
- `question_generation`: 200 requests
- `visual_questions`: 100 requests + manual review of at least 30 outputs

---

## Controlled Rollout Plan

Rollout progression is strictly sequential:

1. `dev`
2. `staging`
3. `limited_prod_cohort`
4. `broader_prod` (optional, per task)

### Gate 1: Development

- Feature flags:
  - `AI_ENABLE_OPENAI=true`
  - `AI_PROVIDER_SHADOW_MODE=true`
  - `AI_PROVIDER_CANARY_PERCENT=0`
- Behavior:
  - Claude serves user-facing output.
  - OpenAI runs in shadow for comparison only (no user impact).
- Exit criteria:
  - No hard gate failure.
  - Logging includes provider/model/tokens/latency/error category for both providers.

### Gate 2: Staging

- Feature flags:
  - `AI_ENABLE_OPENAI=true`
  - `AI_PROVIDER_SHADOW_MODE=true`
  - `AI_PROVIDER_CANARY_PERCENT=0`
- Behavior:
  - Continue Claude primary output.
  - Run at least one full regression batch + dry-run load.
- Exit criteria:
  - Pass all task-specific hard gates.
  - Retry rate and latency remain within thresholds for 2 consecutive runs.

### Gate 3: Limited Production Cohort

- Feature flags:
  - `AI_ENABLE_OPENAI=true`
  - `AI_PROVIDER_SHADOW_MODE=false` for selected task only
  - `AI_PROVIDER_CANARY_PERCENT=5` (increase gradually: 5 -> 10 -> 20)
  - `AI_PROVIDER_PRIMARY=anthropic` (Claude stays baseline)
- Behavior:
  - Claude serves 80-95% of traffic.
  - OpenAI serves canary cohort for the selected task.
  - Anthropic fallback remains enabled for transient OpenAI failures.
- Exit criteria:
  - No severe incidents for 7 days.
  - Quality holds at or above go-threshold.
  - Cost and latency trend stable relative to approved target.

### Gate 4: Broader Production (Optional)

- Increase canary in controlled steps only after each 7-day observation window.
- Keep a rollback-ready state where `AI_PROVIDER_PRIMARY=anthropic` can be restored immediately.

---

## Rollback Criteria

Rollback to Claude-only for affected task immediately if any occur:

1. JSON validity drops below hard gate for 2 consecutive hourly windows.
2. Finnish clarity mean drops by > 0.2 against approved baseline.
3. Retry rate doubles from baseline for > 30 minutes.
4. Latency p95 exceeds threshold by > 25% for > 30 minutes.
5. Token cost/success exceeds approved cap by > 20% for 24 hours.
6. Any critical content-quality incident (unsafe/off-curriculum output) verified by on-call.

---

## Operational Playbook

### Incident response

1. Set `AI_PROVIDER_PRIMARY=anthropic`.
2. Set `AI_PROVIDER_CANARY_PERCENT=0`.
3. Enable `AI_PROVIDER_SHADOW_MODE=true` to continue diagnostics without user impact.
4. Confirm fallback health for transient errors.
5. Capture incident timeline and affected task/model.

### Recovery checklist

1. Root cause classified:
   - prompt drift
   - provider degradation
   - schema/adapter bug
   - traffic pattern anomaly
2. Add/adjust regression fixture if issue was quality-related.
3. Re-run dry-run in `dev` and `staging`.
4. Re-enter limited cohort at 5% only after two successful staging runs.

### Required run artifacts

Each evaluation run must produce:

- run metadata: date, env, task, provider models, prompt version
- scorecard table with all checklist metrics
- go/no-go decision and approver
- rollback command set used for the release

Store summaries in `results/` for traceability.

---

## Dry-Run Procedure (Development/Staging)

1. Enable dual-provider flags in target environment.
2. Execute fixture batch for each task with identical payload ordering.
3. Verify:
   - structured output validity
   - Finnish clarity scoring completion
   - latency/cost/retry calculations populated
4. Confirm decision outcome against go/no-go matrix.
5. Save scorecard and decision log.

---

## Regression Fixtures

Regression fixtures for Finnish quality comparisons live in:

- `tests/fixtures/provider-quality-regression.ts`
- `tests/fixtures/provider-quality-regression.test.ts`

These fixtures must be updated when:

- prompts change materially,
- schema changes,
- new subjects/tasks are introduced.
