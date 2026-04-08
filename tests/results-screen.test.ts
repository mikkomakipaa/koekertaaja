import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { QuestionDetailCard } from '@/components/play/ResultsScreen';
import {
  buildTopicMasteryItems,
  buildQuestionDetails,
  formatResultAnswer,
  getCelebrationQueue,
  getResultsHeaderCopy,
  getResultsFeedbackMessage,
  getResultsPerformanceBand,
  getNextCelebration,
  getNewlyUnlockedBadges,
  getPrimaryWeakTopicHref,
  getResultsBreakdown,
  getResultsSecondaryMeta,
  getSchoolGrade,
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
const resultsScreenSource = readFileSync('src/components/play/ResultsScreen.tsx', 'utf-8');

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

  it('converts quiz scores into deterministic Finnish school grades', () => {
    assert.equal(getSchoolGrade(0, 10).label, '4');
    assert.equal(getSchoolGrade(2, 10).label, '5+');
    assert.equal(getSchoolGrade(3, 10).label, '6-');
    assert.equal(getSchoolGrade(5, 10).label, '7');
    assert.equal(getSchoolGrade(7, 10).label, '8+');
    assert.equal(getSchoolGrade(8, 10).label, '9-');
    assert.equal(getSchoolGrade(9, 10).label, '9.5');
    assert.equal(getSchoolGrade(16, 17).label, '10-');
    assert.equal(getSchoolGrade(10, 10).label, '10');
  });

  it('clamps school grades for invalid or edge-case totals', () => {
    assert.equal(getSchoolGrade(0, 0).label, '4');
    assert.equal(getSchoolGrade(-5, 10).label, '4');
    assert.equal(getSchoolGrade(12, 10).label, '10');
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

  it('formats latex-heavy string answers without escaping them', () => {
    assert.equal(formatResultAnswer('$$\\frac{2}{3}$$'), '$$\\frac{2}{3}$$');
  });

  it('formats multiple_select arrays as readable answer lists', () => {
    assert.equal(
      formatResultAnswer(['$$\\frac{1}{2}$$', '$$\\frac{2}{3}$$'], 'multiple_select'),
      '$$\\frac{1}{2}$$, $$\\frac{2}{3}$$'
    );
  });

  it('formats structured multiple_select answer objects without leaking escaped json', () => {
    assert.equal(
      formatResultAnswer(
        {
          selected: ['$$\\frac{1}{2}$$', '$$\\frac{2}{3}$$'],
          explanation: 'Valitse samannimiset murtoluvut',
        },
        'multiple_select'
      ),
      'selected: $$\\frac{1}{2}$$, $$\\frac{2}{3}$$; explanation: Valitse samannimiset murtoluvut'
    );
  });

  it('formats fraction summary objects as readable labels instead of object dumps', () => {
    assert.equal(
      formatResultAnswer(
        {
          numerator: 3,
          denominator: 4,
          latex: '$$\\frac{3}{4}$$',
        }
      ),
      'numerator: 3; denominator: 4; latex: $$\\frac{3}{4}$$'
    );
  });

  it('formats matching answers without exposing raw json', () => {
    assert.equal(
      formatResultAnswer({ Suomi: 'Helsinki', Ruotsi: 'Tukholma' }, 'matching'),
      'Suomi → Helsinki; Ruotsi → Tukholma'
    );
    assert.equal(
      formatResultAnswer(
        [
          { left: '1/2', right: '$$\\frac{1}{2}$$' },
          { left: '2/3', right: '$$\\frac{2}{3}$$' },
        ],
        'matching'
      ),
      '1/2 → $$\\frac{1}{2}$$; 2/3 → $$\\frac{2}{3}$$'
    );
  });

  it('formats sequential answers as ordered flows', () => {
    assert.equal(formatResultAnswer([2, 0, 1], 'sequential'), '3 → 1 → 2');
    assert.equal(
      formatResultAnswer(
        {
          items: [
            { text: '$$\\frac{1}{2}$$' },
            { text: '$$\\frac{2}{3}$$' },
            { text: '$$\\frac{3}{4}$$' },
          ],
          correct_order: [1, 2, 0],
        },
        'sequential'
      ),
      '$$\\frac{2}{3}$$ → $$\\frac{3}{4}$$ → $$\\frac{1}{2}$$'
    );
  });

  it('degrades gracefully for unsupported nested objects', () => {
    assert.equal(
      formatResultAnswer({ vastaus: { osa: 'arvo' }, pisteet: 2 }),
      'vastaus: osa: arvo; pisteet: 2'
    );
  });

  it('uses the shared formatter in question details for structured answers', () => {
    const structuredAnswers: Answer[] = [
      {
        questionId: 'm1',
        questionText: 'Yhdistä murtoluvut',
        userAnswer: { '1/2': '$$\\frac{2}{3}$$' },
        correctAnswer: { '1/2': '$$\\frac{1}{2}$$' },
        questionType: 'matching',
        isCorrect: false,
        explanation: 'Parit pitää yhdistää oikein.',
      },
      {
        questionId: 's1',
        questionText: 'Järjestä luvut',
        userAnswer: [2, 0, 1],
        correctAnswer: [0, 1, 2],
        questionType: 'sequential',
        isCorrect: false,
        explanation: 'Järjestys on pienimmästä suurimpaan.',
      },
    ];

    const details = buildQuestionDetails(structuredAnswers);
    assert.equal(details[0]?.userAnswer, '1/2 → $$\\frac{2}{3}$$');
    assert.equal(details[0]?.correctAnswer, '1/2 → $$\\frac{1}{2}$$');
    assert.equal(details[1]?.userAnswer, '3 → 1 → 2');
    assert.equal(details[1]?.correctAnswer, '1 → 2 → 3');
  });

  it('renders wrong-answer summaries for latex multiple_select answers without raw json escapes', () => {
    const details = buildQuestionDetails([
      {
        questionId: 'ms-latex',
        questionText: 'Valitse murtoluvut, jotka ovat suurempia kuin 1/3.',
        userAnswer: ['$$\\frac{1}{4}$$'],
        correctAnswer: ['$$\\frac{1}{2}$$', '$$\\frac{2}{3}$$'],
        questionType: 'multiple_select',
        questionOptions: [
          '$$\\frac{1}{4}$$',
          '$$\\frac{1}{3}$$',
          '$$\\frac{1}{2}$$',
          '$$\\frac{2}{3}$$',
          '$$\\frac{1}{5}$$',
        ],
        isCorrect: false,
        explanation: '1/2 ja 2/3 ovat suurempia kuin 1/3.',
      },
    ]);

    const html = renderToString(
      createElement(QuestionDetailCard, {
        question: details[0]!,
        status: 'wrong',
        userAnswer: details[0]!.userAnswer,
        isExpanded: true,
        onToggle: () => {},
        MathRenderer: ({ children }: { children: string }) => createElement('span', null, children),
      })
    );

    assert.ok(html.includes('Valitsit:'));
    assert.ok(html.includes('Oikea vastaus:'));
    assert.ok(html.includes('$$\\frac{1}{4}$$'));
    assert.ok(html.includes('$$\\frac{1}{2}$$, $$\\frac{2}{3}$$'));
    assert.ok(!html.includes('[&quot;$$\\\\frac{1}{2}$$&quot;'));
    assert.ok(!html.includes('{&quot;selected&quot;'));
  });

  it('renders fraction correct-answer summaries without object-json output', () => {
    const html = renderToString(
      createElement(QuestionDetailCard, {
        question: {
          id: 'fraction-summary',
          question: 'Muunna murtoluku sekalukuna.',
          correctAnswer: formatResultAnswer({
            numerator: 7,
            denominator: 4,
            latex: '$$\\frac{7}{4}$$',
            mixed: '1 3/4',
          }),
        },
        status: 'wrong',
        userAnswer: '1 1/4',
        isExpanded: true,
        onToggle: () => {},
        MathRenderer: ({ children }: { children: string }) => createElement('span', null, children),
      })
    );

    assert.ok(html.includes('numerator: 7; denominator: 4; latex: $$\\frac{7}{4}$$; mixed: 1 3/4'));
    assert.ok(!html.includes('[object Object]'));
    assert.ok(!html.includes('{&quot;numerator&quot;'));
  });

  it('builds grade-first header copy used by the results screen', () => {
    assert.deepEqual(getResultsHeaderCopy(9, 10, 'quiz'), {
      title: 'Tulokset',
      supportingText: 'Tietovisan yhteenveto',
    });
    assert.equal(getResultsSecondaryMeta(9, 10), '9 / 10 oikein • 90%');
    assert.deepEqual(getResultsHeaderCopy(9, 10, 'flashcard'), {
      title: 'Tulokset',
      supportingText: 'Harjoituskierroksen yhteenveto',
    });
  });

  it('uses the shared minimal header helper and renders the new summary card stack in the source', () => {
    assert.ok(resultsScreenSource.includes('const resultsHeaderCopy = getResultsHeaderCopy(score, total, mode);'));
    assert.ok(resultsScreenSource.includes('{resultsHeaderCopy.title}'));
    assert.ok(resultsScreenSource.includes('{resultsHeaderCopy.supportingText}'));
    assert.ok(resultsScreenSource.includes('<GradeCard'));
    assert.ok(resultsScreenSource.includes('newlyUnlockedBadges.length > 0'));
    assert.ok(resultsScreenSource.includes('<BadgePreviewCard badges={newlyUnlockedBadges} />'));
    assert.ok(resultsScreenSource.includes('<TopicMasterySection items={topicMasteryItems} />'));
    assert.ok(resultsScreenSource.includes('primaryWeakTopicHref ?'));
  });

  it('builds weak-topic guidance and primary review routing from topic mastery data', () => {
    const items = buildTopicMasteryItems(
      {
        Geometria: { correct: 1, total: 4, percentage: 25 },
        Murtoluvut: { correct: 3, total: 4, percentage: 75 },
        Yhteenlasku: { correct: 5, total: 5, percentage: 100 },
      },
      'FLASH123'
    );

    assert.equal(items[0]?.topic, 'Geometria');
    assert.equal(items[0]?.statusLabel, 'Kertaa seuraavaksi');
    assert.match(items[0]?.guidance ?? '', /kort/);
    assert.equal(items[0]?.reviewHref, '/play/FLASH123?mode=opettele&topic=Geometria');
    assert.equal(items[1]?.reviewHref, '/play/FLASH123?mode=opettele&topic=Murtoluvut');
    assert.equal(items[2]?.reviewHref, null);
    assert.equal(getPrimaryWeakTopicHref(items), '/play/FLASH123?mode=opettele&topic=Geometria');
  });

  it('returns no weak-topic primary CTA when topic data is absent or a perfect score has no weak bands', () => {
    assert.deepEqual(buildTopicMasteryItems({}, 'FLASH123'), []);
    assert.equal(getPrimaryWeakTopicHref([]), null);

    const perfectItems = buildTopicMasteryItems(
      {
        Lukeminen: { correct: 4, total: 4, percentage: 100 },
      },
      'FLASH123'
    );

    assert.equal(getPrimaryWeakTopicHref(perfectItems), null);
  });

  it('keeps badge preview data empty unless there are newly unlocked badges', () => {
    const badges = [
      { id: 'perfect_score', name: 'Täysi onnistuminen' },
      { id: 'streak_3', name: 'Hyvä vastausputki' },
    ];

    assert.deepEqual(getNewlyUnlockedBadges(badges, []), []);
    assert.deepEqual(getNewlyUnlockedBadges(badges, ['streak_3']), [
      { id: 'streak_3', name: 'Hyvä vastausputki' },
    ]);
  });

  it('maps performance bands and feedback copy for the grade card', () => {
    assert.equal(getResultsPerformanceBand(2, 10), 'weak');
    assert.equal(getResultsPerformanceBand(7, 10), 'mid');
    assert.equal(getResultsPerformanceBand(10, 10), 'strong');
    assert.match(getResultsFeedbackMessage(10, 10), /Täysi osuma/);
    assert.match(getResultsFeedbackMessage(3, 10), /heikoimmista aiheista/);
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
