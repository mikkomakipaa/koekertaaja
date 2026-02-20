import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Question, SpeedQuizSession } from '@/types';
import {
  attachSpeedQuizBackNavigationGuard,
  shouldBlockSpeedQuizBackNavigation,
} from '@/lib/speed-quiz/back-navigation-guard';
import {
  advanceSessionOnAnswer,
  advanceSessionOnTimeout,
  createInitialSpeedQuizSession,
  createSpeedQuizResult,
  scoreCorrectAnswer,
  type SpeedQuizScoreState,
} from '@/lib/speed-quiz/session';

function createQuestion(id: string): Question {
  return {
    id,
    question_set_id: 'set-1',
    question_text: `Kysymys ${id}`,
    question_type: 'fill_blank',
    explanation: 'Selitys',
    order_index: 1,
    correct_answer: `oikea-${id}`,
  };
}

function createSessionForTransitions(overrides: Partial<SpeedQuizSession> = {}): SpeedQuizSession {
  const selectedQuestions = Array.from({ length: 10 }, (_, index) => createQuestion(String(index + 1)));
  return {
    mode: 'speed-quiz',
    questionSetCode: 'ABC123',
    selectedQuestions,
    currentQuestionIndex: 0,
    timePerQuestion: 15,
    totalQuestions: 10,
    startTime: 1000,
    questionStartTime: 1000,
    skippedQuestions: [],
    answers: {},
    correctAnswers: [],
    wrongAnswers: [],
    ...overrides,
  };
}

function createBackNavigationWindowMock() {
  const pushStateCalls: unknown[][] = [];
  const listeners = new Map<'popstate', () => void>();
  const addCalls: Array<{ type: 'popstate'; listener: () => void }> = [];
  const removeCalls: Array<{ type: 'popstate'; listener: () => void }> = [];

  return {
    targetWindow: {
      history: {
        pushState: (...args: unknown[]) => {
          pushStateCalls.push(args);
        },
      },
      location: {
        href: 'http://localhost:3000/play/speed-quiz/ABC123',
      },
      addEventListener: (type: 'popstate', listener: () => void) => {
        listeners.set(type, listener);
        addCalls.push({ type, listener });
      },
      removeEventListener: (type: 'popstate', listener: () => void) => {
        if (listeners.get(type) === listener) {
          listeners.delete(type);
        }
        removeCalls.push({ type, listener });
      },
    },
    pushStateCalls,
    addCalls,
    removeCalls,
    triggerPopState: () => {
      listeners.get('popstate')?.();
    },
  };
}

describe('SpeedQuizGame session logic', () => {
  it('creates initial session with 10 selected questions', () => {
    const pool = Array.from({ length: 15 }, (_, index) => createQuestion(String(index + 1)));
    const session = createInitialSpeedQuizSession('ZZZ999', pool);

    assert.equal(session.mode, 'speed-quiz');
    assert.equal(session.questionSetCode, 'ZZZ999');
    assert.equal(session.selectedQuestions.length, 10);
    assert.equal(new Set(session.selectedQuestions.map((question) => question.id)).size, 10);
    assert.equal(session.currentQuestionIndex, 0);
  });

  it('applies streak scoring with bonus from third consecutive correct answer', () => {
    const start: SpeedQuizScoreState = { totalPoints: 0, currentStreak: 0, bestStreak: 0 };
    const afterFirst = scoreCorrectAnswer(start);
    const afterSecond = scoreCorrectAnswer(afterFirst);
    const afterThird = scoreCorrectAnswer(afterSecond);

    assert.deepEqual(afterFirst, { totalPoints: 10, currentStreak: 1, bestStreak: 1 });
    assert.deepEqual(afterSecond, { totalPoints: 20, currentStreak: 2, bestStreak: 2 });
    assert.deepEqual(afterThird, { totalPoints: 35, currentStreak: 3, bestStreak: 3 });
  });

  it('auto-skip advances to next question and finishes on last question', () => {
    const initial = createSessionForTransitions();
    const firstTransition = advanceSessionOnTimeout(initial, initial.selectedQuestions[0].id, 2000);
    assert.equal(firstTransition.shouldFinish, false);
    assert.equal(firstTransition.session.currentQuestionIndex, 1);
    assert.deepEqual(firstTransition.session.skippedQuestions, [initial.selectedQuestions[0].id]);

    const lastQuestionSession = createSessionForTransitions({ currentQuestionIndex: 9 });
    const finalTransition = advanceSessionOnTimeout(
      lastQuestionSession,
      lastQuestionSession.selectedQuestions[9].id,
      3000
    );
    assert.equal(finalTransition.shouldFinish, true);
    assert.equal(finalTransition.session.currentQuestionIndex, 9);
    assert.deepEqual(finalTransition.session.skippedQuestions, [lastQuestionSession.selectedQuestions[9].id]);
  });

  it('answer submission stores answer and categorizes correct vs wrong', () => {
    const initial = createSessionForTransitions();

    const correctTransition = advanceSessionOnAnswer(initial, initial.selectedQuestions[0].id, 'vastaus', true, 2000);
    assert.equal(correctTransition.shouldFinish, false);
    assert.equal(correctTransition.session.currentQuestionIndex, 1);
    assert.deepEqual(correctTransition.session.correctAnswers, [initial.selectedQuestions[0].id]);
    assert.deepEqual(correctTransition.session.wrongAnswers, []);
    assert.equal(correctTransition.session.answers[initial.selectedQuestions[0].id], 'vastaus');

    const wrongTransition = advanceSessionOnAnswer(initial, initial.selectedQuestions[0].id, 'väärä', false, 2000);
    assert.deepEqual(wrongTransition.session.correctAnswers, []);
    assert.deepEqual(wrongTransition.session.wrongAnswers, [initial.selectedQuestions[0].id]);
  });

  it('builds result with correct/wrong/skipped counts and question statuses', () => {
    const session = createSessionForTransitions({
      startTime: Date.now() - 42_000,
      answers: { '1': 'ok', '2': 'nope' },
      correctAnswers: ['1'],
      wrongAnswers: ['2'],
      skippedQuestions: ['3'],
    });
    const score: SpeedQuizScoreState = { totalPoints: 120, currentStreak: 0, bestStreak: 4 };
    const result = createSpeedQuizResult(session, score);

    assert.equal(result.correctCount, 1);
    assert.equal(result.wrongCount, 1);
    assert.equal(result.skippedCount, 1);
    assert.equal(result.score, 120);
    assert.equal(result.bestStreak, 4);
    assert.equal(result.questions.length, 10);
    assert.equal(result.questions[0]?.status, 'correct');
    assert.equal(result.questions[1]?.status, 'wrong');
    assert.equal(result.questions[2]?.status, 'skipped');
  });
});

describe('Speed quiz back navigation guard', () => {
  it('blocks back navigation only while state is playing', () => {
    assert.equal(shouldBlockSpeedQuizBackNavigation('intro'), false);
    assert.equal(shouldBlockSpeedQuizBackNavigation('playing'), true);
    assert.equal(shouldBlockSpeedQuizBackNavigation('results'), false);
  });

  it('pushes guard history entry on attach and on back button press', () => {
    const mock = createBackNavigationWindowMock();
    let blockedCalls = 0;

    const cleanup = attachSpeedQuizBackNavigationGuard(mock.targetWindow, () => {
      blockedCalls += 1;
    });

    assert.equal(mock.pushStateCalls.length, 1);
    assert.equal(mock.addCalls.length, 1);

    mock.triggerPopState();
    assert.equal(blockedCalls, 1);
    assert.equal(mock.pushStateCalls.length, 2);

    cleanup();
  });

  it('removes popstate listener on cleanup to avoid leaks', () => {
    const mock = createBackNavigationWindowMock();
    const cleanup = attachSpeedQuizBackNavigationGuard(mock.targetWindow);

    const attachedListener = mock.addCalls[0]?.listener;
    assert.ok(attachedListener);

    cleanup();
    assert.equal(mock.removeCalls.length, 1);
    assert.equal(mock.removeCalls[0]?.listener, attachedListener);

    mock.triggerPopState();
    assert.equal(mock.pushStateCalls.length, 1);
  });
});
