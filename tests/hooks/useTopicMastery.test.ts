import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  readTopicMasteryFromStorage,
  updateTopicMasteryInStorage,
  getTopicMasteryStats,
  clearTopicMasteryFromStorage,
} from '@/hooks/useTopicMastery';

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

  clear() {
    this.store.clear();
  }
}

describe('useTopicMastery storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('returns empty stats when no data exists', () => {
    const stats = getTopicMasteryStats('ABC123');
    assert.deepStrictEqual(stats, {});
  });

  it('creates a new topic entry on first update', () => {
    const updated = updateTopicMasteryInStorage('ABC123', 'Matematiikka', true);
    assert.ok(updated);
    assert.strictEqual(updated?.Matematiikka.correct, 1);
    assert.strictEqual(updated?.Matematiikka.total, 1);
    assert.strictEqual(updated?.Matematiikka.percentage, 100);
  });

  it('increments total count on wrong answer', () => {
    updateTopicMasteryInStorage('ABC123', 'Biologia', false);
    const updated = updateTopicMasteryInStorage('ABC123', 'Biologia', false);
    assert.ok(updated);
    assert.strictEqual(updated?.Biologia.correct, 0);
    assert.strictEqual(updated?.Biologia.total, 2);
    assert.strictEqual(updated?.Biologia.percentage, 0);
  });

  it('increments correct count on correct answer', () => {
    updateTopicMasteryInStorage('ABC123', 'Kemia', false);
    const updated = updateTopicMasteryInStorage('ABC123', 'Kemia', true);
    assert.ok(updated);
    assert.strictEqual(updated?.Kemia.correct, 1);
    assert.strictEqual(updated?.Kemia.total, 2);
    assert.strictEqual(updated?.Kemia.percentage, 50);
  });

  it('persists data per question set', () => {
    updateTopicMasteryInStorage('ABC123', 'Historia', true);
    updateTopicMasteryInStorage('XYZ999', 'Historia', false);

    const statsA = readTopicMasteryFromStorage('ABC123');
    const statsB = readTopicMasteryFromStorage('XYZ999');

    assert.strictEqual(statsA.Historia.correct, 1);
    assert.strictEqual(statsB.Historia.correct, 0);
  });

  it('stores canonical Finnish topic key when update receives an English alias', () => {
    updateTopicMasteryInStorage('ALIAS01', 'Nouns and Articles', true);
    const stats = readTopicMasteryFromStorage('ALIAS01');

    assert.deepStrictEqual(stats, {
      'Substantiivit ja artikkelit': { correct: 1, total: 1 },
    });
  });

  it('clears mastery data', () => {
    updateTopicMasteryInStorage('ABC123', 'Fysiikka', true);
    const cleared = clearTopicMasteryFromStorage('ABC123');
    assert.strictEqual(cleared, true);
    assert.deepStrictEqual(readTopicMasteryFromStorage('ABC123'), {});
  });
});
