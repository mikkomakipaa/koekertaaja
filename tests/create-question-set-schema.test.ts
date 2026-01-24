import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createQuestionSetSchema } from '../src/lib/validation/schemas';

const basePayload = {
  questionSetName: 'Test Set',
  subject: 'Custom Subject',
  questionCount: 40,
  examLength: 5,
};

test('createQuestionSetSchema rejects invalid subjectType', () => {
  const result = createQuestionSetSchema.safeParse({
    ...basePayload,
    subjectType: 'invalid-type',
  });

  assert.equal(result.success, false);
});

test('createQuestionSetSchema accepts valid subjectType', () => {
  const result = createQuestionSetSchema.safeParse({
    ...basePayload,
    subjectType: 'language',
  });

  assert.equal(result.success, true);
});

test('createQuestionSetSchema accepts missing subjectType', () => {
  const result = createQuestionSetSchema.safeParse(basePayload);
  assert.equal(result.success, true);
});
