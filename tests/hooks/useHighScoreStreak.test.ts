import assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import {
  dismissHighScoreStreakInStorage,
  incrementHighScoreStreakInStorage,
  readHighScoreStreakFromStorage,
} from '@/hooks/useHighScoreStreak';

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

describe('useHighScoreStreak storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('increments count for helppo sessions with at least 80 percent', () => {
    const first = incrementHighScoreStreakInStorage('abc123', 'helppo', 80);
    const second = incrementHighScoreStreakInStorage('abc123', 'helppo', 95);

    assert.deepStrictEqual(first, { count: 1, nudgeDismissed: false });
    assert.deepStrictEqual(second, { count: 2, nudgeDismissed: false });
    assert.deepStrictEqual(readHighScoreStreakFromStorage('ABC123'), {
      count: 2,
      nudgeDismissed: false,
    });
  });

  it('does not increment count for non-helppo difficulty', () => {
    incrementHighScoreStreakInStorage('abc123', 'helppo', 88);
    const updated = incrementHighScoreStreakInStorage('abc123', 'normaali', 100);

    assert.deepStrictEqual(updated, { count: 1, nudgeDismissed: false });
    assert.deepStrictEqual(readHighScoreStreakFromStorage('abc123'), {
      count: 1,
      nudgeDismissed: false,
    });
  });

  it('does not increment count when percentage is below 80', () => {
    incrementHighScoreStreakInStorage('abc123', 'helppo', 85);
    const updated = incrementHighScoreStreakInStorage('abc123', 'helppo', 79);

    assert.deepStrictEqual(updated, { count: 1, nudgeDismissed: false });
    assert.deepStrictEqual(readHighScoreStreakFromStorage('abc123'), {
      count: 1,
      nudgeDismissed: false,
    });
  });

  it('dismiss sets nudgeDismissed to true and persists it', () => {
    incrementHighScoreStreakInStorage('abc123', 'helppo', 82);

    const dismissed = dismissHighScoreStreakInStorage('abc123');

    assert.deepStrictEqual(dismissed, { count: 1, nudgeDismissed: true });
    assert.deepStrictEqual(readHighScoreStreakFromStorage('ABC123'), {
      count: 1,
      nudgeDismissed: true,
    });
  });

  it('returns null for malformed localStorage values', () => {
    localStorage.setItem('helppo_high_score_count_ABC123', '{not valid json');
    assert.strictEqual(readHighScoreStreakFromStorage('abc123'), null);

    localStorage.setItem(
      'helppo_high_score_count_ABC123',
      JSON.stringify({ count: 'two', nudgeDismissed: false })
    );
    assert.strictEqual(readHighScoreStreakFromStorage('abc123'), null);
  });
});
