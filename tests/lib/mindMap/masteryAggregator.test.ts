import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  getTopicMasteryAggregates,
  mapMasteryPercentageToLevel,
} from '@/lib/mindMap/masteryAggregator';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

describe('masteryAggregator', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('maps thresholds exactly at 49, 50, 79 and 80', () => {
    assert.equal(mapMasteryPercentageToLevel(49), 'none');
    assert.equal(mapMasteryPercentageToLevel(50), 'partial');
    assert.equal(mapMasteryPercentageToLevel(79), 'partial');
    assert.equal(mapMasteryPercentageToLevel(80), 'mastered');
  });

  it('maps rounded aggregate percentages on boundary cutoffs', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_BINS50',
      JSON.stringify({
        None49: { correct: 49, total: 100 }, // 49%
        Partial50: { correct: 1, total: 2 }, // 50%
        Partial79: { correct: 79, total: 100 }, // 79%
        Mastered80: { correct: 4, total: 5 }, // 80%
      })
    );

    const aggregates = getTopicMasteryAggregates('BINS50');

    assert.equal(aggregates.None49?.level, 'none');
    assert.equal(aggregates.Partial50?.level, 'partial');
    assert.equal(aggregates.Partial79?.level, 'partial');
    assert.equal(aggregates.Mastered80?.level, 'mastered');
  });

  it('aggregates mastery from existing storage shape', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_ABC123',
      JSON.stringify({
        Algebra: { correct: 2, total: 4 }, // 50
        Geometria: { correct: 8, total: 10 }, // 80
        Historia: { correct: 0, total: 3 }, // 0
      })
    );

    const aggregates = getTopicMasteryAggregates('ABC123');

    assert.deepEqual(aggregates.Algebra, {
      correct: 2,
      total: 4,
      percentage: 50,
      level: 'partial',
    });

    assert.deepEqual(aggregates.Geometria, {
      correct: 8,
      total: 10,
      percentage: 80,
      level: 'mastered',
    });

    assert.deepEqual(aggregates.Historia, {
      correct: 0,
      total: 3,
      percentage: 0,
      level: 'none',
    });
  });

  it('normalizes non-positive values from storage safely', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_NEG999',
      JSON.stringify({
        Epakelpo: { correct: -4, total: -2 },
      })
    );

    const aggregates = getTopicMasteryAggregates('NEG999');
    assert.deepEqual(aggregates.Epakelpo, {
      correct: 0,
      total: 0,
      percentage: 0,
      level: 'none',
    });
  });
});
