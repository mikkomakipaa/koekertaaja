import assert from 'node:assert/strict';
import { test } from 'node:test';

import { promptRegressionScenarios } from './fixtures/prompt-regression-evaluation';
import {
  evaluateProviderScenario,
  getJsonFailureRate,
  PROMPT_ROLLBACK_THRESHOLDS,
  summarizeScenario,
} from './fixtures/prompt-regression-evaluator';

test('prompt regression dataset covers core flows with both providers', () => {
  const flows = new Set(promptRegressionScenarios.map((scenario) => scenario.flow));
  assert.deepEqual([...flows].sort(), [
    'flashcard_grammar',
    'flashcard_vocabulary',
    'quiz_helppo',
    'quiz_normaali',
    'topic_identification',
  ]);

  for (const scenario of promptRegressionScenarios) {
    assert.ok(scenario.expectedQualitativeOutcomes.length >= 3, `${scenario.id}: missing expected outcomes`);
    assert.ok(scenario.material.length >= 20, `${scenario.id}: material should be descriptive`);
    assert.equal(typeof scenario.providers.anthropic.baseline.output, 'string');
    assert.equal(typeof scenario.providers.openai.refactored.output, 'string');
  }
});

test('refactored prompts meet output contracts and valid question ratio gates', () => {
  for (const scenario of promptRegressionScenarios) {
    for (const provider of ['anthropic', 'openai'] as const) {
      const metrics = evaluateProviderScenario(scenario, provider);
      assert.equal(
        metrics.refactoredContract.jsonValid,
        true,
        `${scenario.id}/${provider}: refactored output JSON must be valid`
      );
      assert.equal(
        metrics.refactoredContract.meetsMinimumValidQuestionRatio,
        true,
        `${scenario.id}/${provider}: refactored output missed min valid-question ratio`
      );
    }
  }
});

test('refactored prompts do not regress quality score and keep provider parity', () => {
  for (const scenario of promptRegressionScenarios) {
    const summary = summarizeScenario(scenario);

    assert.ok(
      summary.anthropic.qualityDelta >= -PROMPT_ROLLBACK_THRESHOLDS.maxQualityDrop,
      `${scenario.id}/anthropic: quality dropped too much (${summary.anthropic.qualityDelta})`
    );
    assert.ok(
      summary.openai.qualityDelta >= -PROMPT_ROLLBACK_THRESHOLDS.maxQualityDrop,
      `${scenario.id}/openai: quality dropped too much (${summary.openai.qualityDelta})`
    );
    assert.ok(
      summary.providerParityGap <= PROMPT_ROLLBACK_THRESHOLDS.maxProviderParityGap,
      `${scenario.id}: provider parity gap too high (${summary.providerParityGap})`
    );
  }
});

test('json failure rate remains within rollback threshold across all provider samples', () => {
  const allSamples = promptRegressionScenarios.flatMap((scenario) => [
    scenario.providers.anthropic.baseline,
    scenario.providers.anthropic.refactored,
    scenario.providers.openai.baseline,
    scenario.providers.openai.refactored,
  ]);

  const jsonFailureRate = getJsonFailureRate(allSamples);
  assert.ok(
    jsonFailureRate <= PROMPT_ROLLBACK_THRESHOLDS.maxJsonFailureRate,
    `JSON failure rate ${jsonFailureRate} exceeded ${PROMPT_ROLLBACK_THRESHOLDS.maxJsonFailureRate}`
  );
});
