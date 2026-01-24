import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { aiQuestionFixtures } from './fixtures/question-types';

test('aiQuestionSchema accepts fixtures for each question type', () => {
  for (const [type, fixture] of Object.entries(aiQuestionFixtures)) {
    const result = aiQuestionSchema.safeParse(fixture);
    assert.equal(result.success, true, `Fixture for ${type} should pass aiQuestionSchema`);
  }
});

test('aiQuestionSchema rejects multiple_choice without options', () => {
  const { options: _options, ...fixture } = structuredClone(aiQuestionFixtures.multiple_choice);
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects fill_blank without correct_answer', () => {
  const { correct_answer: _correctAnswer, ...fixture } = structuredClone(
    aiQuestionFixtures.fill_blank,
  );
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects true_false without correct_answer', () => {
  const { correct_answer: _correctAnswer, ...fixture } = structuredClone(
    aiQuestionFixtures.true_false,
  );
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects matching with empty pairs', () => {
  const fixture = structuredClone(aiQuestionFixtures.matching);
  fixture.pairs = [];
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects short_answer without correct_answer', () => {
  const { correct_answer: _correctAnswer, ...fixture } = structuredClone(
    aiQuestionFixtures.short_answer,
  );
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects sequential without correct_order', () => {
  const { correct_order: _correctOrder, ...fixture } = structuredClone(
    aiQuestionFixtures.sequential,
  );
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects map without options', () => {
  const { options: _options, ...fixture } = structuredClone(aiQuestionFixtures.map);
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects map with invalid regions', () => {
  const fixture = structuredClone(aiQuestionFixtures.map);
  fixture.options.regions = [{ id: '', label: '' }];
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});
