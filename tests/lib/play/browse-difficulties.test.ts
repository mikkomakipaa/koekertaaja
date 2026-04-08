import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { QuestionSet } from '@/types';
import {
  buildDifficultyHref,
  buildQuizTopicSelectorHref,
  getAvailableDifficulties,
  getDifficultyTargetSet,
  hasMultipleTopicOptions,
} from '@/lib/play/browse-difficulties';

const createSet = (overrides: Partial<QuestionSet>): QuestionSet => ({
  id: 'set-id',
  code: 'SET123',
  name: 'Murtoluvut',
  subject: 'math',
  difficulty: 'normaali',
  mode: 'quiz',
  question_count: 10,
  status: 'published',
  created_at: '2026-02-19T12:00:00.000Z',
  ...overrides,
});

describe('browse-difficulties', () => {
  it('returns only quiz difficulties that exist', () => {
    const sets = [
      createSet({ code: 'H1', difficulty: 'helppo', question_count: 8 }),
      createSet({ code: 'N1', difficulty: 'normaali', question_count: 9 }),
    ];

    assert.deepStrictEqual(getAvailableDifficulties(sets), ['helppo', 'normaali']);
  });

  it('adds aikahaaste when normaali has at least 10 questions', () => {
    const sets = [
      createSet({ code: 'H1', difficulty: 'helppo', question_count: 8 }),
      createSet({ code: 'N1', difficulty: 'normaali', question_count: 10 }),
    ];

    assert.deepStrictEqual(getAvailableDifficulties(sets), ['helppo', 'normaali', 'aikahaaste']);
  });

  it('does not add aikahaaste when normaali has fewer than 10 questions', () => {
    const sets = [
      createSet({ code: 'H1', difficulty: 'helppo', question_count: 14 }),
      createSet({ code: 'N1', difficulty: 'normaali', question_count: 9 }),
    ];

    assert.deepStrictEqual(getAvailableDifficulties(sets), ['helppo', 'normaali']);
  });

  it('resolves aikahaaste target to normaali set code', () => {
    const sets = [
      createSet({ code: 'H1', difficulty: 'helppo', question_count: 14 }),
      createSet({ code: 'N1', difficulty: 'normaali', question_count: 12 }),
    ];

    const target = getDifficultyTargetSet(sets, 'aikahaaste');
    assert.strictEqual(target?.code, 'N1');
  });

  it('builds aikahaaste href with difficulty query param', () => {
    assert.strictEqual(buildDifficultyHref('XYZ789', 'pelaa', 'aikahaaste'), '/play/XYZ789?difficulty=aikahaaste');
  });

  it('builds normal quiz difficulty href with mode query param', () => {
    assert.strictEqual(buildDifficultyHref('XYZ789', 'pelaa', 'helppo'), '/play/XYZ789?mode=pelaa');
    assert.strictEqual(buildDifficultyHref('XYZ789', 'opettele', 'normaali'), '/play/XYZ789?mode=opettele');
  });

  it('builds quiz topic-selector hrefs on the shared play route', () => {
    assert.strictEqual(buildQuizTopicSelectorHref('XYZ789'), '/play/XYZ789?mode=pelaa&selectTopic=1');
  });

  it('detects when browse cards should show topic selection', () => {
    assert.strictEqual(hasMultipleTopicOptions({ Murtoluvut: 12, Geometria: 8 }), true);
    assert.strictEqual(hasMultipleTopicOptions({ Murtoluvut: 12 }), false);
  });
});
