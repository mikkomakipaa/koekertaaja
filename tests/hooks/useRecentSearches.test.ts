import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from '@/hooks/useRecentSearches';

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

describe('useRecentSearches storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('adds and retrieves recent searches', () => {
    addRecentSearch('Matematiikka');
    addRecentSearch('Historia');

    const stored = getRecentSearches();
    assert.strictEqual(stored[0], 'Historia');
    assert.strictEqual(stored[1], 'Matematiikka');
  });

  it('deduplicates recent searches', () => {
    addRecentSearch('Matematiikka');
    addRecentSearch('matematiikka');

    const stored = getRecentSearches();
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(stored[0], 'matematiikka');
  });

  it('limits recent searches to 5 items', () => {
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach((item) => addRecentSearch(item));
    const stored = getRecentSearches();
    assert.strictEqual(stored.length, 5);
    assert.strictEqual(stored[0], 'F');
    assert.strictEqual(stored[4], 'B');
  });

  it('clears recent searches', () => {
    addRecentSearch('Biologia');
    clearRecentSearches();
    assert.deepStrictEqual(getRecentSearches(), []);
  });
});
