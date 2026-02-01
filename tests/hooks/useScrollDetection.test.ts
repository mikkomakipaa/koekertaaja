import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getScrolledState } from '@/hooks/useScrollDetection';

describe('useScrollDetection helpers', () => {
  it('returns false at or below threshold', () => {
    assert.strictEqual(getScrolledState(0, 10), false);
    assert.strictEqual(getScrolledState(10, 10), false);
  });

  it('returns true above threshold', () => {
    assert.strictEqual(getScrolledState(11, 10), true);
  });
});
