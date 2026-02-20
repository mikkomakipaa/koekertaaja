import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildQuestionDetails, getResultsBreakdown, toggleQuestionExpanded } from '@/lib/play/results-screen';
import type { Answer } from '@/types';

const answers: Answer[] = [
  {
    questionId: 'q1',
    questionText: 'Mikä on 2 + 2?',
    userAnswer: '4',
    correctAnswer: '4',
    isCorrect: true,
    explanation: 'Peruslasku',
  },
  {
    questionId: 'q2',
    questionText: 'Mikä on Suomen pääkaupunki?',
    userAnswer: 'Turku',
    correctAnswer: 'Helsinki',
    isCorrect: false,
    explanation: 'Pääkaupunki on Helsinki',
  },
  {
    questionId: 'q3',
    questionText: 'Mikä on 10 / 2?',
    userAnswer: null,
    correctAnswer: '5',
    isCorrect: false,
    explanation: 'Jakolasku',
  },
];

describe('ResultsScreen', () => {
  it('builds correct/wrong/skipped breakdown for speed quiz mode', () => {
    const summary = getResultsBreakdown(answers, ['q3']);
    assert.deepEqual(summary, {
      correctCount: 1,
      wrongCount: 1,
      skippedCount: 1,
    });
  });

  it('builds question details with status per question', () => {
    const details = buildQuestionDetails(answers, ['q3']);

    assert.equal(details.length, 3);
    assert.equal(details[0]?.status, 'correct');
    assert.equal(details[1]?.status, 'wrong');
    assert.equal(details[2]?.status, 'skipped');
    assert.equal(details[1]?.userAnswer, 'Turku');
    assert.equal(details[2]?.correctAnswer, '5');
  });

  it('treats all incorrect answers as wrong when skippedQuestions is omitted', () => {
    const summary = getResultsBreakdown(answers);
    assert.deepEqual(summary, {
      correctCount: 1,
      wrongCount: 2,
      skippedCount: 0,
    });
  });

  it('toggles expanded question id for expand/collapse interaction', () => {
    assert.equal(toggleQuestionExpanded(null, 'q1'), 'q1');
    assert.equal(toggleQuestionExpanded('q1', 'q1'), null);
    assert.equal(toggleQuestionExpanded('q1', 'q2'), 'q2');
  });
});
