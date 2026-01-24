import assert from 'node:assert/strict';
import { test } from 'node:test';
import { extendQuestionCountSchema } from '../src/lib/validation/schemas';

test('extendQuestionCountSchema rejects non-numeric values', () => {
  const result = extendQuestionCountSchema.safeParse('not-a-number');
  assert.equal(result.success, false);
});

test('extendQuestionCountSchema rejects zero and negative values', () => {
  const zeroResult = extendQuestionCountSchema.safeParse('0');
  const negativeResult = extendQuestionCountSchema.safeParse('-5');

  assert.equal(zeroResult.success, false);
  assert.equal(negativeResult.success, false);
});

test('extendQuestionCountSchema rejects values above max', () => {
  const result = extendQuestionCountSchema.safeParse('201');
  assert.equal(result.success, false);
});

test('extendQuestionCountSchema accepts valid values', () => {
  const result = extendQuestionCountSchema.safeParse('15');
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data, 15);
  }
});
