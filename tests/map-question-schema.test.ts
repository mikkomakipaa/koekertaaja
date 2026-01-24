import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { baseMapAIQuestion } from './fixtures/question-types';

test('aiQuestionSchema accepts valid map question', () => {
  const result = aiQuestionSchema.safeParse(baseMapAIQuestion);
  assert.equal(result.success, true);
});

test('aiQuestionSchema rejects map question without options', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseMapAIQuestion,
    options: undefined,
  });

  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects map question with empty regions', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseMapAIQuestion,
    options: {
      ...baseMapAIQuestion.options,
      regions: [],
    },
  });

  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects map question with invalid correct_answer for multi_region', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseMapAIQuestion,
    options: {
      ...baseMapAIQuestion.options,
      inputMode: 'multi_region',
    },
    correct_answer: 'uusimaa',
  });

  assert.equal(result.success, false);
});

test('aiQuestionSchema rejects map question with invalid correct_answer for single_region', () => {
  const result = aiQuestionSchema.safeParse({
    ...baseMapAIQuestion,
    options: {
      ...baseMapAIQuestion.options,
      inputMode: 'single_region',
    },
    correct_answer: ['uusimaa'],
  });

  assert.equal(result.success, false);
});
