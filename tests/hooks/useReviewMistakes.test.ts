import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  readMistakesFromStorage,
  upsertMistakeInStorage,
  removeMistakeFromStorage,
  clearMistakesFromStorage,
} from '@/hooks/useReviewMistakes';

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

describe('useReviewMistakes storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('adds a mistake and reads it back', () => {
    const updated = upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '5',
    });

    assert.ok(updated);
    const stored = readMistakesFromStorage('ABC123');
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(stored[0]?.questionId, 'q1');
  });

  it('deduplicates mistakes by questionId', () => {
    upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '5',
    });

    upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '6',
    });

    const stored = readMistakesFromStorage('ABC123');
    assert.strictEqual(stored.length, 1);
    assert.strictEqual(stored[0]?.userAnswer, '6');
  });

  it('removes a mistake by questionId', () => {
    upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '5',
    });

    const updated = removeMistakeFromStorage('ABC123', 'q1');
    assert.ok(updated);
    assert.strictEqual(updated?.length, 0);
  });

  it('clears all mistakes for a question set', () => {
    upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '5',
    });

    const cleared = clearMistakesFromStorage('ABC123');
    assert.strictEqual(cleared, true);
    assert.strictEqual(readMistakesFromStorage('ABC123').length, 0);
  });

  it('keeps mistakes separate per question set', () => {
    upsertMistakeInStorage('ABC123', {
      questionId: 'q1',
      questionText: 'What is 2+2?',
      correctAnswer: '4',
      userAnswer: '5',
    });

    upsertMistakeInStorage('XYZ999', {
      questionId: 'q2',
      questionText: 'What is 3+3?',
      correctAnswer: '6',
      userAnswer: '7',
    });

    assert.strictEqual(readMistakesFromStorage('ABC123').length, 1);
    assert.strictEqual(readMistakesFromStorage('XYZ999').length, 1);
  });
});
