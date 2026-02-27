import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import {
  extractQuestionSetCodeFromTopicMasteryKey,
  formatPracticedSetDropdownLabel,
  listPracticedSetCodesFromStorage,
  listPracticedSetDropdownItemsFromStorage,
  readTopicMasteryFromStorage,
} from '@/lib/mindMap/storage';

class LocalStorageMock {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

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

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

describe('mindMap storage helpers', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('returns empty object for missing or malformed mastery storage', () => {
    assert.deepEqual(readTopicMasteryFromStorage('MISSING'), {});

    globalThis.localStorage?.setItem('topic_mastery_BADJSON', '{oops');
    assert.deepEqual(readTopicMasteryFromStorage('BADJSON'), {});

    globalThis.localStorage?.setItem('topic_mastery_ARRAY', JSON.stringify(['bad-shape']));
    assert.deepEqual(readTopicMasteryFromStorage('ARRAY'), {});
  });

  it('sanitizes mastery stats from storage to safe non-negative numbers', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_SANITIZE',
      JSON.stringify({
        Algebra: { correct: 3, total: 5 },
        Geometria: { correct: -2, total: 6 },
        Historia: { correct: 1, total: -4 },
        Kemia: { correct: 'x', total: 10 },
      })
    );

    assert.deepEqual(readTopicMasteryFromStorage('SANITIZE'), {
      Algebra: { correct: 3, total: 5 },
      Geometria: { correct: 0, total: 6 },
      Historia: { correct: 1, total: 0 },
      Kemia: { correct: 0, total: 10 },
    });
  });

  it('merges alias topic keys into one canonical Finnish key', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_MERGE',
      JSON.stringify({
        'Nouns and Articles': { correct: 1, total: 2 },
        'Substantiivit ja artikkelit': { correct: 2, total: 3 },
      })
    );

    assert.deepEqual(readTopicMasteryFromStorage('MERGE'), {
      'Substantiivit ja artikkelit': { correct: 3, total: 5 },
    });
  });

  it('rewrites mixed legacy payload to canonical merged payload after read', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_REWRITE',
      JSON.stringify({
        'Nouns and Articles': { correct: 1, total: 2 },
        'Substantiivit ja artikkelit': { correct: 2, total: 3 },
      })
    );

    const merged = readTopicMasteryFromStorage('REWRITE');
    assert.deepEqual(merged, {
      'Substantiivit ja artikkelit': { correct: 3, total: 5 },
    });

    assert.equal(
      globalThis.localStorage?.getItem('topic_mastery_REWRITE'),
      JSON.stringify({
        'Substantiivit ja artikkelit': { correct: 3, total: 5 },
      })
    );
  });

  it('discovers practiced set codes from mastery keys only', () => {
    globalThis.localStorage?.setItem('topic_mastery_META1', JSON.stringify({ Algebra: { correct: 1, total: 2 } }));
    globalThis.localStorage?.setItem('topic_mastery_META2', JSON.stringify({ Algebra: { correct: 0, total: 0 } }));
    globalThis.localStorage?.setItem('topic_mastery_meta_META1', JSON.stringify({ name: 'Matikka' }));
    globalThis.localStorage?.setItem('topic_mastery_', JSON.stringify({ Algebra: { correct: 1, total: 2 } }));
    globalThis.localStorage?.setItem('unrelated_key', JSON.stringify({}));

    assert.deepEqual(listPracticedSetCodesFromStorage(), ['META1']);
  });

  it('resolves dropdown metadata with fallback label', () => {
    globalThis.localStorage?.setItem('topic_mastery_ABC123', JSON.stringify({ Luvut: { correct: 1, total: 1 } }));
    globalThis.localStorage?.setItem('topic_mastery_meta_ABC123', JSON.stringify({
      name: 'Matematiikka kevät',
      subject: 'Matematiikka',
      examDate: '12.2.2026',
      grade: '5',
      practicedAt: 123456789,
    }));

    globalThis.localStorage?.setItem('topic_mastery_ZZZ999', JSON.stringify({ Historia: { correct: 2, total: 3 } }));

    assert.deepEqual(listPracticedSetDropdownItemsFromStorage(), [
      {
        code: 'ABC123',
        label: 'Matematiikka kevät',
        subject: 'Matematiikka',
        examDate: '12.2.2026',
        difficulty: null,
        grade: '5',
        practicedAt: 123456789,
      },
      {
        code: 'ZZZ999',
        label: 'ZZZ999',
        subject: null,
        examDate: null,
        difficulty: null,
        grade: null,
        practicedAt: null,
      },
    ]);
  });

  it('formats dropdown labels using subject, exam date and class grade with safe fallbacks', () => {
    assert.equal(
      formatPracticedSetDropdownLabel({
        code: 'FULL1',
        label: 'Matematiikka',
        subject: 'Matematiikka',
        examDate: '12.2.2026',
        grade: '5',
      }),
      'Matematiikka • 12.2.2026 • 5. lk'
    );

    assert.equal(
      formatPracticedSetDropdownLabel({
        code: 'PART1',
        label: 'Historia',
        subject: 'Historia',
        examDate: null,
        grade: '6',
      }),
      'Historia • 6. lk'
    );

    assert.equal(
      formatPracticedSetDropdownLabel({
        code: 'DATE1',
        label: 'Biologia',
        subject: 'Biologia',
        examDate: '7.3.2026',
        grade: null,
      }),
      'Biologia • 7.3.2026'
    );

    assert.equal(
      formatPracticedSetDropdownLabel({
        code: 'DUPL1',
        label: 'Biologia',
        subject: 'Biologia',
        examDate: 'Biologia',
        grade: null,
      }),
      'Biologia'
    );

    assert.equal(
      formatPracticedSetDropdownLabel({
        code: 'FALL1',
        label: '',
        subject: null,
        examDate: null,
        grade: null,
      }),
      'FALL1'
    );
  });

  it('extracts set code from mastery keys and rejects invalid keys', () => {
    assert.equal(extractQuestionSetCodeFromTopicMasteryKey('topic_mastery_ABC123'), 'ABC123');
    assert.equal(extractQuestionSetCodeFromTopicMasteryKey('topic_mastery_meta_ABC123'), null);
    assert.equal(extractQuestionSetCodeFromTopicMasteryKey('topic_mastery_'), null);
    assert.equal(extractQuestionSetCodeFromTopicMasteryKey('last_score_ABC123'), null);
  });
});
