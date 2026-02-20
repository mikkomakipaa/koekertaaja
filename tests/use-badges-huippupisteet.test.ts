import assert from 'node:assert/strict';
import test from 'node:test';
import { hasUnlockedHuippupisteet } from '@/hooks/useBadges';

test('Huippupisteet unlocks on personal best and equal score', () => {
  assert.equal(hasUnlockedHuippupisteet({ totalPoints: 90, previousPersonalBest: 80 }), true);
  assert.equal(hasUnlockedHuippupisteet({ totalPoints: 80, previousPersonalBest: 80 }), true);
  assert.equal(hasUnlockedHuippupisteet({ totalPoints: 79, previousPersonalBest: 80 }), false);
});

test('Huippupisteet does not unlock on zero-point sessions', () => {
  assert.equal(hasUnlockedHuippupisteet({ totalPoints: 0, previousPersonalBest: 0 }), false);
});
