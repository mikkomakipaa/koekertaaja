import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getQuizPrimaryActionLabel, resolveDashboardPrimaryAction } from '@/lib/play/primary-action';
import type { QuestionSet } from '@/types';

const baseSet = (overrides: Partial<QuestionSet>): QuestionSet => ({
  id: overrides.id ?? 'set-1',
  code: overrides.code ?? 'ABC123',
  name: overrides.name ?? 'Matematiikka',
  subject: overrides.subject ?? 'math',
  difficulty: overrides.difficulty ?? 'normaali',
  mode: overrides.mode ?? 'quiz',
  question_count: overrides.question_count ?? 15,
  status: overrides.status ?? 'published',
  created_at: overrides.created_at ?? '2026-03-01T10:00:00.000Z',
  ...overrides,
});

describe('primary-action helpers', () => {
  it('uses the same quiz CTA language as the browse page', () => {
    assert.equal(
      getQuizPrimaryActionLabel({ difficulty: 'normaali', hasInProgress: true, hasScore: true }),
      'Jatka'
    );
    assert.equal(
      getQuizPrimaryActionLabel({ difficulty: 'helppo', hasInProgress: false, hasScore: true }),
      'Jatka Helppoa'
    );
    assert.equal(
      getQuizPrimaryActionLabel({ difficulty: 'normaali', hasInProgress: false, hasScore: false }),
      'Aloita Normaali'
    );
  });

  it('prefers in-progress quiz sessions for the dashboard CTA', () => {
    const quizSet = baseSet({ code: 'QUIZ01', difficulty: 'helppo' });

    const action = resolveDashboardPrimaryAction({
      questionSets: [quizSet],
      getLastScore: () => null,
      getSessionProgress: () => ({ answered: 4, total: 10, percentage: 40 }),
    });

    assert.equal(action.label, 'Jatka');
    assert.equal(action.href, '/play/QUIZ01?mode=pelaa');
    assert.equal(action.mode, 'quiz');
  });

  it('falls back to flashcards when no quiz continuation exists', () => {
    const flashcardSet = baseSet({
      id: 'set-2',
      code: 'CARD01',
      mode: 'flashcard',
      created_at: '2026-03-02T10:00:00.000Z',
    });

    const action = resolveDashboardPrimaryAction({
      questionSets: [flashcardSet],
      getLastScore: () => null,
      getSessionProgress: () => null,
    });

    assert.equal(action.label, 'Opettele');
    assert.equal(action.href, '/play/CARD01?mode=opettele');
    assert.equal(action.mode, 'study');
  });
});
