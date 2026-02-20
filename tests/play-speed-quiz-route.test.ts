import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import type { QuestionSet } from '@/types';
import {
  getSpeedQuizModeData,
  isSpeedQuizEligible,
  SpeedQuizModePageContent,
} from '@/app/play/speed-quiz/page';

function createQuestionSet(overrides: Partial<QuestionSet> = {}): QuestionSet {
  return {
    id: overrides.id ?? 'set-1',
    code: overrides.code ?? 'ABC123',
    name: overrides.name ?? 'Testisarja',
    subject: overrides.subject ?? 'math',
    difficulty: overrides.difficulty ?? 'normaali',
    mode: overrides.mode ?? 'quiz',
    question_count: overrides.question_count ?? 10,
    status: overrides.status ?? 'published',
    grade: overrides.grade,
    topic: overrides.topic,
    subtopic: overrides.subtopic,
    exam_length: overrides.exam_length,
    prompt_metadata: overrides.prompt_metadata,
    subject_type: overrides.subject_type,
    created_at: overrides.created_at ?? new Date().toISOString(),
    updated_at: overrides.updated_at,
  };
}

describe('/play/speed-quiz route', () => {
  it('filters eligibility to quiz sets with at least 10 questions', async () => {
    const sourceSets: QuestionSet[] = [
      createQuestionSet({ id: 'eligible', code: 'ELI001', question_count: 10, mode: 'quiz' }),
      createQuestionSet({ id: 'too-short', code: 'BAD001', question_count: 9, mode: 'quiz' }),
      createQuestionSet({ id: 'flashcard', code: 'FLA001', question_count: 20, mode: 'flashcard' }),
    ];

    const data = await getSpeedQuizModeData(async () => sourceSets);

    assert.equal(data.eligibleSets.length, 1);
    assert.equal(data.eligibleSets[0]?.code, 'ELI001');
    assert.equal(data.ineligibleSets.length, 1);
    assert.equal(data.ineligibleSets[0]?.code, 'BAD001');
  });

  it('marks set eligibility correctly', () => {
    assert.equal(isSpeedQuizEligible(createQuestionSet({ question_count: 10, mode: 'quiz' })), true);
    assert.equal(isSpeedQuizEligible(createQuestionSet({ question_count: 9, mode: 'quiz' })), false);
    assert.equal(isSpeedQuizEligible(createQuestionSet({ question_count: 20, mode: 'flashcard' })), false);
  });

  it('renders eligible cards with speed-quiz navigation links', () => {
    const html = renderToString(
      createElement(SpeedQuizModePageContent, {
        eligibleSets: [
          createQuestionSet({
            id: 'eligible-2',
            code: 'SPD010',
            name: 'Murtoluvut',
            subject: 'math',
            question_count: 12,
            grade: 5,
          }),
        ],
        ineligibleSets: [],
      })
    );

    assert.ok(html.includes('Aikahaaste'));
    assert.ok(html.includes('Murtoluvut'));
    assert.ok(html.includes('href="/play/speed-quiz/SPD010"'));
    assert.ok(html.includes('kysymystä'));
    assert.ok(html.includes('5<!-- -->. lk'));
  });

  it('renders empty state when no eligible sets exist', () => {
    const html = renderToString(
      createElement(SpeedQuizModePageContent, {
        eligibleSets: [],
        ineligibleSets: [createQuestionSet({ id: 'short-1', code: 'LOW001', question_count: 3 })],
      })
    );

    assert.ok(html.includes('Ei vielä pika-kokeeseen sopivia kysymyssarjoja'));
    assert.ok(html.includes('href="/create"'));
    assert.ok(html.includes('Liian vähän kysymyksiä (tarvitaan vähintään 10)'));
  });
});
