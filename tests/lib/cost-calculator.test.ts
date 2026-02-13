import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateCost } from '../../src/lib/ai/costCalculator';

test('calculateCost returns 0 when usage is missing', () => {
  assert.equal(calculateCost(undefined, 'gpt-5-mini'), 0);
  assert.equal(calculateCost({ input_tokens: 100 }, 'gpt-5-mini'), 0);
  assert.equal(calculateCost({ output_tokens: 100 }, 'gpt-5-mini'), 0);
});

test('calculateCost uses model pricing and rounds to 4 decimals', () => {
  const result = calculateCost(
    {
      input_tokens: 200_000,
      output_tokens: 100_000,
    },
    'gpt-5-mini'
  );

  // (0.2 * 0.25) + (0.1 * 2) = 0.25
  assert.equal(result, 0.25);
});
