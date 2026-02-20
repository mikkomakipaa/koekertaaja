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

test('aiQuestionSchema accepts valid multiple_select with 5 options and 2-3 correct answers', () => {
  const fixture = structuredClone(aiQuestionFixtures.multiple_select);
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, true);
});

test('aiQuestionSchema rejects multiple_select with too few correct answers', () => {
  const fixture = structuredClone(aiQuestionFixtures.multiple_select);
  fixture.correct_answers = ['2'];
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects multiple_select with all options correct', () => {
  const fixture = structuredClone(aiQuestionFixtures.multiple_select);
  fixture.correct_answers = [...fixture.options];
  const result = aiQuestionSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects multiple_select with non-5 option count', () => {
  const fixture = structuredClone(aiQuestionFixtures.multiple_select);
  fixture.options = fixture.options.slice(0, 4);
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
