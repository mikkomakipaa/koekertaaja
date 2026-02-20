import assert from 'node:assert/strict';
import test from 'node:test';
import { getBadgeDefinitionCount, hasUnlockedNopeaJaTarkka } from '@/hooks/useBadges';

test('Nopea ja tarkka unlocks only for perfect 10/10 in Aikahaaste mode', () => {
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'aikahaaste', score: 10, totalQuestions: 10 }),
    true
  );
});

test('Nopea ja tarkka does not unlock in non-Aikahaaste modes', () => {
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'helppo', score: 10, totalQuestions: 10 }),
    false
  );
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'normaali', score: 10, totalQuestions: 10 }),
    false
  );
});

test('Nopea ja tarkka does not unlock for imperfect or skipped Aikahaaste runs', () => {
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'aikahaaste', score: 9, totalQuestions: 10 }),
    false
  );
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'aikahaaste', score: 8, totalQuestions: 10 }),
    false
  );
  assert.equal(
    hasUnlockedNopeaJaTarkka({ difficulty: 'aikahaaste', score: 10, totalQuestions: 9 }),
    false
  );
});

test('Badge definition count is 12', () => {
  assert.equal(getBadgeDefinitionCount(), 12);
});
