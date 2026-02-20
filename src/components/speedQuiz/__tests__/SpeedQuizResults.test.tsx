import assert from 'node:assert';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  SpeedQuizResults,
  createSpeedQuizResultsActionHandlers,
  toggleExpandedQuestion,
  truncateQuestionText,
} from '@/components/speedQuiz/SpeedQuizResults';
import type { SpeedQuizResult } from '@/types';

const buildQuestion = (index: number, status: 'correct' | 'wrong' | 'skipped') => ({
  id: `q-${index}`,
  question: `Kysymys ${index}: Tämä on pidempi kysymysteksti, jota käytetään testaamaan että listaus renderöityy oikein.`,
  status,
  userAnswer: status === 'wrong' ? `Väärä vastaus ${index}` : undefined,
  correctAnswer: `Oikea vastaus ${index}`,
});

const testResult: SpeedQuizResult = {
  totalTime: 98,
  correctCount: 4,
  wrongCount: 3,
  skippedCount: 3,
  score: 520,
  bestStreak: 2,
  questions: [
    buildQuestion(1, 'correct'),
    buildQuestion(2, 'wrong'),
    buildQuestion(3, 'skipped'),
    buildQuestion(4, 'correct'),
    buildQuestion(5, 'wrong'),
    buildQuestion(6, 'skipped'),
    buildQuestion(7, 'correct'),
    buildQuestion(8, 'wrong'),
    buildQuestion(9, 'skipped'),
    buildQuestion(10, 'correct'),
  ],
};

describe('SpeedQuizResults', () => {
  it('renders score summary and stats', () => {
    const html = renderToString(
      createElement(SpeedQuizResults, {
        result: testResult,
        questionSetCode: 'ABC123',
        questionSetName: 'Murtoluvut',
        onRetry: () => {},
        onChooseAnother: () => {},
        onGoHome: () => {},
      })
    );

    assert.ok(html.includes('Aikahaaste suoritettu!'));
    assert.ok(html.includes('Murtoluvut'));
    assert.ok(html.includes('ABC123'));
    assert.ok(html.includes('~98 sekuntia'));
    assert.ok(html.includes('520'));
    assert.match(html, /4(?:<!-- -->)?\/10/);
    assert.match(html, /3(?:<!-- -->)?\/10/);
  });

  it('renders all 10 questions in the list', () => {
    const html = renderToString(
      createElement(SpeedQuizResults, {
        result: testResult,
        questionSetCode: 'ABC123',
        questionSetName: 'Murtoluvut',
        onRetry: () => {},
        onChooseAnother: () => {},
        onGoHome: () => {},
      })
    );

    const questionCount = (html.match(/aria-controls=\"speed-quiz-question-/g) || []).length;
    assert.strictEqual(questionCount, 10);
  });

  it('toggles expanded question state for expand/collapse interaction', () => {
    assert.strictEqual(toggleExpandedQuestion(null, 'q-1'), 'q-1');
    assert.strictEqual(toggleExpandedQuestion('q-1', 'q-1'), null);
    assert.strictEqual(toggleExpandedQuestion('q-1', 'q-2'), 'q-2');
  });

  it('truncates long question text to preview length', () => {
    const longText = 'a'.repeat(120);
    const preview = truncateQuestionText(longText, 100);
    assert.strictEqual(preview.length, 103);
    assert.ok(preview.endsWith('...'));
  });

  it('fires action callbacks from generated handlers', () => {
    let retryCalls = 0;
    let chooseCalls = 0;
    let homeCalls = 0;

    const actions = createSpeedQuizResultsActionHandlers({
      onRetry: () => {
        retryCalls += 1;
      },
      onChooseAnother: () => {
        chooseCalls += 1;
      },
      onGoHome: () => {
        homeCalls += 1;
      },
    });

    actions.handleRetry();
    actions.handleChooseAnother();
    actions.handleGoHome();

    assert.strictEqual(retryCalls, 1);
    assert.strictEqual(chooseCalls, 1);
    assert.strictEqual(homeCalls, 1);
  });
});
