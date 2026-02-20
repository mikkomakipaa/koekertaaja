import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import {
  hasCelebratedAllBadges,
  hasCelebratedPerfectScore,
  markAllBadgesCelebrated,
  markPerfectScoreCelebrated,
} from '@/lib/utils/celebrations';

type LocalStorageMock = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

function createLocalStorageMock(): LocalStorageMock {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

const originalLocalStorage = globalThis.localStorage;

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: originalLocalStorage,
    configurable: true,
  });
});

describe('celebration storage utils', () => {
  it('tracks perfect-score celebration per question set', () => {
    assert.equal(hasCelebratedPerfectScore('SET-1'), false);

    markPerfectScoreCelebrated('SET-1');

    assert.equal(hasCelebratedPerfectScore('SET-1'), true);
    assert.equal(hasCelebratedPerfectScore('SET-2'), false);
  });

  it('does not duplicate question set entries for perfect-score celebration', () => {
    markPerfectScoreCelebrated('SET-1');
    markPerfectScoreCelebrated('SET-1');

    const stored = globalThis.localStorage.getItem('koekertaaja_perfect_scores');
    assert.equal(stored, '["SET-1"]');
  });

  it('handles malformed perfect-score localStorage payloads safely', () => {
    globalThis.localStorage.setItem('koekertaaja_perfect_scores', '{bad json');
    assert.equal(hasCelebratedPerfectScore('SET-1'), false);
    const originalError = console.error;
    console.error = () => {};
    try {
      markPerfectScoreCelebrated('SET-1');
      assert.equal(hasCelebratedPerfectScore('SET-1'), false);
    } finally {
      console.error = originalError;
    }
  });

  it('tracks all-badges celebration once globally', () => {
    assert.equal(hasCelebratedAllBadges(), false);
    markAllBadgesCelebrated();
    assert.equal(hasCelebratedAllBadges(), true);
  });
});
