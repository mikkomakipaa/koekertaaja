import assert from 'node:assert/strict';
import test from 'node:test';

import type { Question, QuestionSet } from '@/types/questions';
import {
  canRunSpeedQuiz,
  getSpeedQuizEligibleQuestionCount,
  getSpeedQuizEligibilityMessage,
  selectRandomQuestions,
  shuffleArray,
} from '../speedQuiz';

function createQuestion(index: number): Question {
  return {
    id: `q-${index}`,
    question_set_id: 'set-1',
    question_text: `Question ${index}`,
    question_type: 'short_answer',
    explanation: 'Selitys',
    order_index: index,
    correct_answer: `answer-${index}`,
  };
}

function createQuestionSet(overrides: Partial<QuestionSet> = {}): QuestionSet {
  return {
    id: 'set-1',
    code: 'ABC123',
    name: 'Testisetti',
    subject: 'Matematiikka',
    difficulty: 'helppo',
    mode: 'quiz',
    question_count: 10,
    status: 'published',
    created_at: '2026-02-19T00:00:00.000Z',
    ...overrides,
  };
}

test('shuffleArray keeps all items and does not mutate the input', () => {
  const source = Array.from({ length: 12 }, (_, index) => index + 1);
  const original = [...source];

  const shuffled = shuffleArray(source);

  assert.deepEqual(source, original);
  assert.notEqual(shuffled, source);
  assert.equal(shuffled.length, source.length);

  const sortedShuffled = [...shuffled].sort((a, b) => a - b);
  assert.deepEqual(sortedShuffled, source);
});

test('shuffleArray produces different order in repeated runs', () => {
  const source = Array.from({ length: 20 }, (_, index) => index + 1);
  const sourceAsString = source.join(',');
  const runs = 40;

  let producedDifferentOrder = false;

  for (let i = 0; i < runs; i += 1) {
    if (shuffleArray(source).join(',') !== sourceAsString) {
      producedDifferentOrder = true;
      break;
    }
  }

  assert.equal(producedDifferentOrder, true);
});

test('selectRandomQuestions returns the requested amount for valid input', () => {
  const questions = Array.from({ length: 20 }, (_, index) => createQuestion(index));

  const selected = selectRandomQuestions(questions);

  assert.equal(selected.length, 10);

  const sourceIds = new Set(questions.map((question) => question.id));
  selected.forEach((question) => {
    assert.equal(sourceIds.has(question.id), true);
  });
});

test('selectRandomQuestions throws when there are fewer than requested questions', () => {
  const questions = Array.from({ length: 5 }, (_, index) => createQuestion(index));

  assert.throws(
    () => selectRandomQuestions(questions),
    /Not enough questions for speed quiz: requires at least 10 eligible questions, received 5/
  );
});

test('selectRandomQuestions excludes matching (Yhdistä) questions from selection', () => {
  const questions: Question[] = [
    ...Array.from({ length: 10 }, (_, index) => createQuestion(index)),
    {
      id: 'q-match-1',
      question_set_id: 'set-1',
      question_text: 'Yhdistä sanat',
      question_type: 'matching',
      explanation: 'Selitys',
      order_index: 99,
      pairs: [
        { left: 'kissa', right: 'cat' },
        { left: 'koira', right: 'dog' },
      ],
    },
  ];

  const selected = selectRandomQuestions(questions);
  assert.equal(selected.length, 10);
  assert.equal(selected.some((question) => question.question_type === 'matching'), false);
});

test('selectRandomQuestions excludes multiple_select questions from selection', () => {
  const questions: Question[] = [
    ...Array.from({ length: 10 }, (_, index) => createQuestion(index)),
    {
      id: 'q-ms-1',
      question_set_id: 'set-1',
      question_text: 'Valitse kaikki oikeat',
      question_type: 'multiple_select',
      explanation: 'Selitys',
      order_index: 99,
      options: ['A', 'B', 'C', 'D', 'E'],
      correct_answers: ['A', 'C'],
    },
  ];

  const selected = selectRandomQuestions(questions);
  assert.equal(selected.length, 10);
  assert.equal(selected.some((question) => question.question_type === 'multiple_select'), false);
});

test('canRunSpeedQuiz returns correct eligibility result', () => {
  assert.equal(canRunSpeedQuiz(createQuestionSet()), true);
  assert.equal(canRunSpeedQuiz(createQuestionSet({ question_count: 9 })), false);
  assert.equal(canRunSpeedQuiz(createQuestionSet({ mode: 'flashcard' })), false);
  assert.equal(
    canRunSpeedQuiz(createQuestionSet({ mode: 'flashcard', question_count: 20 })),
    false
  );
});

test('getSpeedQuizEligibilityMessage returns Finnish messages and null when eligible', () => {
  assert.equal(getSpeedQuizEligibilityMessage(createQuestionSet()), null);
  assert.equal(
    getSpeedQuizEligibilityMessage(createQuestionSet({ question_count: 8 })),
    'Tarvitaan vähintään 10 kysymystä'
  );
  assert.equal(
    getSpeedQuizEligibilityMessage(createQuestionSet({ mode: 'flashcard' })),
    'Aikahaaste toimii vain tietovisoilla'
  );
});

test('getSpeedQuizEligibleQuestionCount excludes matching and multiple_select questions', () => {
  const questions: Question[] = [
    ...Array.from({ length: 8 }, (_, index) => createQuestion(index)),
    {
      id: 'q-match-1',
      question_set_id: 'set-1',
      question_text: 'Yhdistä termit',
      question_type: 'matching',
      explanation: 'Selitys',
      order_index: 101,
      pairs: [{ left: 'a', right: '1' }],
    },
    {
      id: 'q-ms-1',
      question_set_id: 'set-1',
      question_text: 'Valitse kaikki',
      question_type: 'multiple_select',
      explanation: 'Selitys',
      order_index: 103,
      options: ['A', 'B', 'C', 'D', 'E'],
      correct_answers: ['A', 'B'],
    },
    {
      id: 'q-match-2',
      question_set_id: 'set-1',
      question_text: 'Yhdistä lisää',
      question_type: 'matching',
      explanation: 'Selitys',
      order_index: 102,
      pairs: [{ left: 'b', right: '2' }],
    },
  ];

  assert.equal(getSpeedQuizEligibleQuestionCount(questions), 8);
});
