import assert from 'node:assert/strict';
import { test } from 'node:test';
import { providerQualityRegressionFixtures } from './provider-quality-regression';

test('provider quality regression fixtures cover every AI task type', () => {
  const tasks = new Set(providerQualityRegressionFixtures.map((fixture) => fixture.task));
  assert.deepEqual([...tasks].sort(), [
    'flashcard_creation',
    'question_generation',
    'topic_identification',
    'visual_questions',
  ]);
});

test('provider quality regression fixtures include required checklist metrics', () => {
  for (const fixture of providerQualityRegressionFixtures) {
    assert.ok(fixture.id.length > 0, 'fixture id is required');
    assert.ok(fixture.inputSummary.length > 20, `${fixture.id}: input summary should be descriptive`);

    for (const sample of [fixture.baseline, fixture.candidate]) {
      assert.equal(typeof sample.model, 'string', `${fixture.id}: model must be defined`);
      assert.equal(sample.jsonValid, true, `${fixture.id}: jsonValid must be true for regression baseline`);
      assert.ok(
        sample.finnishGradeClarityScore >= 1 && sample.finnishGradeClarityScore <= 5,
        `${fixture.id}: finnishGradeClarityScore must be within rubric bounds`
      );
      assert.ok(sample.output.startsWith('{') && sample.output.endsWith('}'), `${fixture.id}: output should be JSON-like`);
      assert.ok(sample.notes.length >= 10, `${fixture.id}: notes should explain quality tradeoff`);
    }
  }
});
