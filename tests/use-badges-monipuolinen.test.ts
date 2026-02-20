import assert from 'node:assert/strict';
import test from 'node:test';
import { hasUnlockedMonipuolinen } from '@/hooks/useBadges';

test('Monipuolinen unlock requires helppo, normaali and aikahaaste', () => {
  assert.equal(hasUnlockedMonipuolinen(['helppo']), false);
  assert.equal(hasUnlockedMonipuolinen(['normaali']), false);
  assert.equal(hasUnlockedMonipuolinen(['aikahaaste']), false);
  assert.equal(hasUnlockedMonipuolinen(['helppo', 'normaali']), false);
  assert.equal(hasUnlockedMonipuolinen(['helppo', 'aikahaaste']), false);
  assert.equal(hasUnlockedMonipuolinen(['normaali', 'aikahaaste']), false);
  assert.equal(hasUnlockedMonipuolinen(['helppo', 'normaali', 'aikahaaste']), true);
  assert.equal(hasUnlockedMonipuolinen(['helppo', 'normaali', 'aikahaaste', 'review']), true);
});
