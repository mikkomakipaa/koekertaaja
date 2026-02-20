import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { Question } from '@/types';
import {
  AIKAHAASTE_QUESTION_COUNT,
  getAikahaasteTimeoutTransition,
  isAikahaasteMode,
  selectRandomQuestionsForAikahaaste,
  shouldShowAikahaasteTimer,
} from '@/lib/play/aikahaaste';

function createQuestion(id: string): Question {
  return {
    id,
    question_set_id: 'set-1',
    question_text: `Question ${id}`,
    question_type: 'fill_blank',
    explanation: 'Selitys',
    order_index: 1,
    correct_answer: `answer-${id}`,
  };
}

function createMatchingQuestion(id: string): Question {
  return {
    id,
    question_set_id: 'set-1',
    question_text: `Match ${id}`,
    question_type: 'matching',
    explanation: 'Selitys',
    order_index: 1,
    pairs: [
      { left: 'A', right: '1' },
      { left: 'B', right: '2' },
    ],
  };
}

describe('aikahaaste utils', () => {
  it('detects aikahaaste mode only for quiz play route', () => {
    assert.strictEqual(
      isAikahaasteMode({ difficultyParam: 'aikahaaste', studyMode: 'pelaa', isReviewMode: false }),
      true
    );
    assert.strictEqual(
      isAikahaasteMode({ difficultyParam: 'normaali', studyMode: 'pelaa', isReviewMode: false }),
      false
    );
    assert.strictEqual(
      isAikahaasteMode({ difficultyParam: 'aikahaaste', studyMode: 'opettele', isReviewMode: false }),
      false
    );
    assert.strictEqual(
      isAikahaasteMode({ difficultyParam: 'aikahaaste', studyMode: 'pelaa', isReviewMode: true }),
      false
    );
  });

  it('selects 10 random questions for aikahaaste from the provided pool', () => {
    const questions = Array.from({ length: 20 }, (_, index) => createQuestion(String(index + 1)));
    const sequence = [0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6, 0.5, 0.15, 0.85, 0.25, 0.75, 0.35, 0.65, 0.45, 0.55, 0.05, 0.95];
    let idx = 0;

    const selected = selectRandomQuestionsForAikahaaste(
      questions,
      AIKAHAASTE_QUESTION_COUNT,
      () => sequence[idx++ % sequence.length]
    );

    assert.strictEqual(selected.length, AIKAHAASTE_QUESTION_COUNT);
    assert.strictEqual(new Set(selected.map((question) => question.id)).size, AIKAHAASTE_QUESTION_COUNT);
    assert.notDeepStrictEqual(selected.map((question) => question.id), questions.slice(0, 10).map((question) => question.id));
  });

  it('excludes matching (Yhdistä) questions from aikahaaste selection', () => {
    const questions: Question[] = [
      ...Array.from({ length: 10 }, (_, index) => createQuestion(String(index + 1))),
      ...Array.from({ length: 5 }, (_, index) => createMatchingQuestion(`m-${index + 1}`)),
    ];

    const selected = selectRandomQuestionsForAikahaaste(questions);

    assert.strictEqual(selected.length, AIKAHAASTE_QUESTION_COUNT);
    assert.ok(selected.every((question) => question.question_type !== 'matching'));
  });

  it('ends quiz on timeout at last question and advances otherwise', () => {
    assert.deepStrictEqual(getAikahaasteTimeoutTransition(0, 10), {
      shouldEnd: false,
      nextQuestionIndex: 1,
    });
    assert.deepStrictEqual(getAikahaasteTimeoutTransition(9, 10), {
      shouldEnd: true,
      nextQuestionIndex: 9,
    });
  });

  it('shows timer only while aikahaaste is actively running', () => {
    assert.strictEqual(
      shouldShowAikahaasteTimer({
        isAikahaaste: true,
        isRunning: true,
        showIntro: false,
        state: 'playing',
      }),
      true
    );

    assert.strictEqual(
      shouldShowAikahaasteTimer({
        isAikahaaste: true,
        isRunning: false,
        showIntro: false,
        state: 'playing',
      }),
      false
    );

    assert.strictEqual(
      shouldShowAikahaasteTimer({
        isAikahaaste: true,
        isRunning: true,
        showIntro: true,
        state: 'playing',
      }),
      false
    );

    assert.strictEqual(
      shouldShowAikahaasteTimer({
        isAikahaaste: false,
        isRunning: true,
        showIntro: false,
        state: 'playing',
      }),
      false
    );
  });
});
