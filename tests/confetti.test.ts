import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_COLORS,
  generateConfetti,
  getConfettiParticleCount,
  isMobileViewport,
  scheduleConfettiCleanup,
} from '@/components/celebrations/Confetti';

describe('Confetti helpers', () => {
  it('generates the requested particle count with valid properties', () => {
    const pieces = generateConfetti(60, DEFAULT_COLORS);

    assert.equal(pieces.length, 60);

    for (const piece of pieces) {
      assert.ok(piece.x >= 0 && piece.x <= 100);
      assert.ok(piece.delay >= 0 && piece.delay <= 300);
      assert.ok(piece.duration >= 2000 && piece.duration <= 3000);
      assert.ok(piece.rotation >= 0 && piece.rotation <= 360);
      assert.ok(DEFAULT_COLORS.includes(piece.color as (typeof DEFAULT_COLORS)[number]));
      assert.ok([8, 12, 16].includes(piece.size));
    }
  });

  it('resolves mobile viewport and particle count', () => {
    assert.equal(isMobileViewport(767), true);
    assert.equal(isMobileViewport(768), false);

    assert.equal(getConfettiParticleCount(undefined, 375), 40);
    assert.equal(getConfettiParticleCount(80, 375), 40);
    assert.equal(getConfettiParticleCount(undefined, 1024), 60);
    assert.equal(getConfettiParticleCount(80, 1024), 80);
  });

  it('fires cleanup callback after timeout', (context) => {
    context.mock.timers.enable({ apis: ['setTimeout'] });

    let callCount = 0;
    const timer = scheduleConfettiCleanup(() => {
      callCount += 1;
    }, 3500);

    assert.notEqual(timer, null);
    context.mock.timers.tick(3499);
    assert.equal(callCount, 0);

    context.mock.timers.tick(1);
    assert.equal(callCount, 1);
  });

  it('returns null when cleanup callback is missing', () => {
    const timer = scheduleConfettiCleanup(undefined, 3500);
    assert.equal(timer, null);
  });
});
