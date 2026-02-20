import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildQuestionDetails,
  getCelebrationQueue,
  getNextCelebration,
  getResultsBreakdown,
  isPerfectScoreSession,
  toggleQuestionExpanded
} from '@/lib/play/results-screen';
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

  it('preserves raw data for multiple_select option-level feedback', () => {
    const multiSelectAnswers: Answer[] = [
      {
        questionId: 'ms1',
        questionText: 'Mitkä ovat alkulukuja?',
        userAnswer: ['2', '4'],
        correctAnswer: ['2', '3'],
        questionType: 'multiple_select',
        questionOptions: ['2', '3', '4', '8', '9'],
        isCorrect: false,
        explanation: '2 ja 3 ovat alkulukuja.',
      },
    ];

    const details = buildQuestionDetails(multiSelectAnswers);
    assert.equal(details[0]?.questionType, 'multiple_select');
    assert.deepEqual(details[0]?.questionOptions, ['2', '3', '4', '8', '9']);
    assert.deepEqual(details[0]?.rawCorrectAnswer, ['2', '3']);
    assert.deepEqual(details[0]?.rawUserAnswer, ['2', '4']);
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

  it('detects perfect score only when no questions are skipped', () => {
    assert.equal(
      isPerfectScoreSession({ score: 10, total: 10, skippedQuestions: [] }),
      true
    );
    assert.equal(
      isPerfectScoreSession({ score: 10, total: 10, skippedQuestions: ['q1'] }),
      false
    );
    assert.equal(
      isPerfectScoreSession({ score: 9, total: 10, skippedQuestions: [] }),
      false
    );
  });

  it('builds celebration queue in deterministic order', () => {
    const queue = getCelebrationQueue({
      score: 10,
      total: 10,
      skippedQuestions: [],
      questionSetCode: 'ABC123',
      allBadgesUnlocked: true,
      hasCelebratedPerfect: false,
      hasCelebratedAllBadges: false,
    });

    assert.deepEqual(queue, ['perfect-score', 'all-badges']);
  });

  it('does not add perfect-score celebration when question set code is missing', () => {
    const queue = getCelebrationQueue({
      score: 10,
      total: 10,
      skippedQuestions: [],
      allBadgesUnlocked: false,
      hasCelebratedPerfect: false,
      hasCelebratedAllBadges: false,
    });

    assert.deepEqual(queue, []);
  });

  it('adds all-badges celebration independently when perfect-score requirements are not met', () => {
    const queue = getCelebrationQueue({
      score: 9,
      total: 10,
      skippedQuestions: [],
      questionSetCode: 'ABC123',
      allBadgesUnlocked: true,
      hasCelebratedPerfect: false,
      hasCelebratedAllBadges: false,
    });

    assert.deepEqual(queue, ['all-badges']);
  });

  it('skips celebrations when already celebrated or requirements are not met', () => {
    assert.deepEqual(
      getCelebrationQueue({
        score: 10,
        total: 10,
        skippedQuestions: ['q1'],
        questionSetCode: 'ABC123',
        allBadgesUnlocked: false,
        hasCelebratedPerfect: false,
        hasCelebratedAllBadges: false,
      }),
      []
    );

    assert.deepEqual(
      getCelebrationQueue({
        score: 10,
        total: 10,
        skippedQuestions: [],
        questionSetCode: 'ABC123',
        allBadgesUnlocked: true,
        hasCelebratedPerfect: true,
        hasCelebratedAllBadges: true,
      }),
      []
    );
  });

  it('returns next celebration from queue progression', () => {
    const queue = ['perfect-score', 'all-badges'] as const;
    assert.equal(getNextCelebration([...queue], 'perfect-score'), 'all-badges');
    assert.equal(getNextCelebration([...queue], 'all-badges'), null);
    assert.equal(getNextCelebration([...queue], null), null);
  });
});
