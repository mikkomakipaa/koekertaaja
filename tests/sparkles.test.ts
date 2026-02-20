import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_SPARKLE_COLORS, generateSparkles } from '@/components/celebrations/Sparkles';

describe('Sparkles helpers', () => {
  it('generates the requested sparkle count with expected properties', () => {
    const sparkles = generateSparkles(30, DEFAULT_SPARKLE_COLORS);

    assert.equal(sparkles.length, 30);

    for (const sparkle of sparkles) {
      assert.ok(sparkle.x >= 0 && sparkle.x <= 100);
      assert.ok(sparkle.y >= 0 && sparkle.y <= 100);
      assert.ok(sparkle.delay >= 0 && sparkle.delay <= 500);
      assert.ok(sparkle.duration >= 900 && sparkle.duration <= 1500);
      assert.equal(sparkle.size, 4);
      assert.ok(DEFAULT_SPARKLE_COLORS.includes(sparkle.color as (typeof DEFAULT_SPARKLE_COLORS)[number]));
    }
  });
});
