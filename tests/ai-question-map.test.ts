import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { baseMapAIQuestion } from './fixtures/question-types';

test('aiQuestionSchema accepts map questions', () => {
  const result = aiQuestionSchema.safeParse(baseMapAIQuestion);

  assert.equal(result.success, true);
});
