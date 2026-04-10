import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  dismissHighScoreStreakInStorage,
  incrementHighScoreStreakInStorage,
  readHighScoreStreakFromStorage,
} from '@/hooks/useHighScoreStreak';
import {
  fetchProgressionNudgeState,
  getInitialProgressionNudgeFetchState,
  shouldIncrementProgressionNudge,
  shouldShowProgressionNudge,
} from '@/hooks/useProgressionNudge';

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

describe('useProgressionNudge helpers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns shouldNudge false after one qualifying session', () => {
    const first = incrementHighScoreStreakInStorage('abc123', 'helppo', 80);

    assert.deepEqual(first, { count: 1, nudgeDismissed: false });
    assert.equal(
      shouldShowProgressionNudge('helppo', first?.count ?? 0, first?.nudgeDismissed ?? false),
      false
    );
  });

  it('returns shouldNudge true after two qualifying sessions at at least 80 percent', () => {
    assert.equal(shouldIncrementProgressionNudge('helppo', 8, 10), true);
    incrementHighScoreStreakInStorage('abc123', 'helppo', 80);
    const second = incrementHighScoreStreakInStorage('abc123', 'helppo', 90);

    assert.deepEqual(second, { count: 2, nudgeDismissed: false });
    assert.equal(
      shouldShowProgressionNudge('helppo', second?.count ?? 0, second?.nudgeDismissed ?? false),
      true
    );
  });

  it('returns shouldNudge false after dismiss', () => {
    incrementHighScoreStreakInStorage('abc123', 'helppo', 85);
    incrementHighScoreStreakInStorage('abc123', 'helppo', 90);
    const dismissed = dismissHighScoreStreakInStorage('abc123');

    assert.deepEqual(readHighScoreStreakFromStorage('abc123'), {
      count: 2,
      nudgeDismissed: true,
    });
    assert.equal(
      shouldShowProgressionNudge(
        'helppo',
        dismissed?.count ?? 0,
        dismissed?.nudgeDismissed ?? false
      ),
      false
    );
  });

  it('returns shouldNudge false for non-helppo difficulty and does not increment', () => {
    assert.equal(shouldIncrementProgressionNudge('normaali', 10, 10), false);
    const updated = incrementHighScoreStreakInStorage('abc123', 'normaali', 100);

    assert.equal(updated, null);
    assert.equal(shouldShowProgressionNudge('normaali', 2, false), false);
  });

  it('populates normaaliCode from the related normal API response', async () => {
    let fetchCalls = 0;
    globalThis.fetch = (async (input: string | URL | Request) => {
      fetchCalls += 1;
      assert.equal(String(input), '/api/question-sets?code=QUIZ123&relatedNormal=1');
      return {
        ok: true,
        json: async () => ({
          data: {
            relatedNormalCode: 'QUIZ124',
          },
        }),
      } as Response;
    }) as typeof fetch;

    assert.deepEqual(getInitialProgressionNudgeFetchState(true, 'QUIZ123'), {
      normaaliCode: null,
      isLoading: true,
    });

    const resolved = await fetchProgressionNudgeState('QUIZ123');

    assert.equal(fetchCalls, 1);
    assert.deepEqual(resolved, {
      normaaliCode: 'QUIZ124',
      isLoading: false,
    });
  });

  it('returns null normaaliCode when API returns null and still avoids unnecessary fetches before nudge', async () => {
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return {
        ok: true,
        json: async () => ({
          data: {
            relatedNormalCode: null,
          },
        }),
      } as Response;
    }) as typeof fetch;

    assert.deepEqual(getInitialProgressionNudgeFetchState(false, 'QUIZ404'), {
      normaaliCode: null,
      isLoading: false,
    });

    const resolved = await fetchProgressionNudgeState('QUIZ404');

    assert.equal(fetchCalls, 1);
    assert.deepEqual(resolved, {
      normaaliCode: null,
      isLoading: false,
    });
  });
});
