import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { describe, it } from 'node:test';
import { buildGroupedQuestionSets } from '@/lib/play/group-question-sets';
import type { QuestionSet } from '@/types';

const makeSet = (overrides: Partial<QuestionSet>): QuestionSet => ({
  id: overrides.id ?? overrides.code ?? crypto.randomUUID(),
  code: overrides.code ?? 'CODE01',
  name: overrides.name ?? 'Sarja - Helppo',
  subject: overrides.subject ?? 'math',
  grade: overrides.grade ?? 4,
  difficulty: overrides.difficulty ?? 'helppo',
  mode: overrides.mode ?? 'quiz',
  topic: overrides.topic,
  subtopic: overrides.subtopic,
  topic_distribution: overrides.topic_distribution,
  question_count: overrides.question_count ?? 20,
  exam_length: overrides.exam_length,
  exam_date: overrides.exam_date ?? '2026-04-09',
  status: overrides.status ?? 'published',
  prompt_metadata: overrides.prompt_metadata,
  created_at: overrides.created_at ?? '2026-04-08T10:00:00.000Z',
  updated_at: overrides.updated_at,
  user_id: overrides.user_id,
  subject_type: overrides.subject_type,
});

describe('buildGroupedQuestionSets', () => {
  it('keeps one helppo, one normaali, and one flashcard in the same group', () => {
    const grouped = buildGroupedQuestionSets([
      makeSet({ code: 'H1', name: 'Ympäristöoppi - Helppo', difficulty: 'helppo', mode: 'quiz' }),
      makeSet({ code: 'N1', name: 'Ympäristöoppi - Normaali', difficulty: 'normaali', mode: 'quiz', created_at: '2026-04-08T10:01:00.000Z' }),
      makeSet({ code: 'F1', name: 'Ympäristöoppi - Kortit', difficulty: 'normaali', mode: 'flashcard', created_at: '2026-04-08T10:02:00.000Z' }),
    ]);

    assert.equal(grouped.length, 1);
    assert.deepEqual(grouped[0].sets.map((set) => set.code), ['H1', 'N1', 'F1']);
  });

  it('splits duplicate helppo and normaali pairs into separate groups', () => {
    const grouped = buildGroupedQuestionSets([
      makeSet({ code: 'H1', name: 'Desimaaliluvut - Helppo', difficulty: 'helppo', mode: 'quiz', grade: 6, created_at: '2025-12-10T16:37:23.844Z' }),
      makeSet({ code: 'N1', name: 'Desimaaliluvut - Normaali', difficulty: 'normaali', mode: 'quiz', grade: 6, created_at: '2025-12-10T16:37:24.311Z' }),
      makeSet({ code: 'H2', name: 'Desimaaliluvut - Helppo', difficulty: 'helppo', mode: 'quiz', grade: 6, created_at: '2025-12-10T16:57:52.631Z' }),
      makeSet({ code: 'N2', name: 'Desimaaliluvut - Normaali', difficulty: 'normaali', mode: 'quiz', grade: 6, created_at: '2025-12-10T16:57:53.252Z' }),
    ]);

    assert.equal(grouped.length, 2);
    assert.deepEqual(grouped[0].sets.map((set) => set.code), ['H1', 'N1']);
    assert.deepEqual(grouped[1].sets.map((set) => set.code), ['H2', 'N2']);
  });
});
