import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateQuestionAnswer } from '../src/lib/questions/answer-evaluation';
import type {
  FillBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  SequentialQuestion,
  ShortAnswerQuestion,
  TrueFalseQuestion,
  FlashcardQuestion,
} from '../src/types/questions';
import { aiQuestionFixtures } from './fixtures/question-types';

const baseQuestionFields = {
  id: 'question-1',
  question_set_id: 'set-1',
  question_text: 'Placeholder?',
  explanation: 'Selitys.',
  order_index: 0,
  topic: 'Testi',
};

test('evaluateQuestionAnswer handles multiple_choice', () => {
  const question: MultipleChoiceQuestion = {
    ...baseQuestionFields,
    question_type: 'multiple_choice',
    question_text: aiQuestionFixtures.multiple_choice.question,
    explanation: aiQuestionFixtures.multiple_choice.explanation,
    options: aiQuestionFixtures.multiple_choice.options,
    correct_answer: aiQuestionFixtures.multiple_choice.correct_answer,
  };

  assert.equal(evaluateQuestionAnswer(question, '4').isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, '5').isCorrect, false);
});

test('evaluateQuestionAnswer handles fill_blank with leniency', () => {
  const question: FillBlankQuestion = {
    ...baseQuestionFields,
    question_type: 'fill_blank',
    question_text: aiQuestionFixtures.fill_blank.question,
    explanation: aiQuestionFixtures.fill_blank.explanation,
    correct_answer: aiQuestionFixtures.fill_blank.correct_answer,
    acceptable_answers: aiQuestionFixtures.fill_blank.acceptable_answers,
  };

  assert.equal(evaluateQuestionAnswer(question, 'vuonna 1917').isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, '1918').isCorrect, false);
});

test('evaluateQuestionAnswer handles true_false', () => {
  const question: TrueFalseQuestion = {
    ...baseQuestionFields,
    question_type: 'true_false',
    question_text: aiQuestionFixtures.true_false.question,
    explanation: aiQuestionFixtures.true_false.explanation,
    correct_answer: aiQuestionFixtures.true_false.correct_answer,
  };

  assert.equal(evaluateQuestionAnswer(question, true).isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, false).isCorrect, false);
});

test('evaluateQuestionAnswer handles matching', () => {
  const question: MatchingQuestion = {
    ...baseQuestionFields,
    question_type: 'matching',
    question_text: aiQuestionFixtures.matching.question,
    explanation: aiQuestionFixtures.matching.explanation,
    pairs: aiQuestionFixtures.matching.pairs,
  };

  const correctAnswer = {
    Suomi: 'Helsinki',
    Ruotsi: 'Tukholma',
  };
  const wrongAnswer = {
    Suomi: 'Tukholma',
    Ruotsi: 'Helsinki',
  };

  assert.equal(evaluateQuestionAnswer(question, correctAnswer).isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, wrongAnswer).isCorrect, false);
});

test('evaluateQuestionAnswer handles short_answer with alternatives', () => {
  const question: ShortAnswerQuestion = {
    ...baseQuestionFields,
    question_type: 'short_answer',
    question_text: aiQuestionFixtures.short_answer.question,
    explanation: aiQuestionFixtures.short_answer.explanation,
    correct_answer: aiQuestionFixtures.short_answer.correct_answer,
    acceptable_answers: aiQuestionFixtures.short_answer.acceptable_answers,
  };

  assert.equal(evaluateQuestionAnswer(question, 'Helsingin kaupunki').isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, 'Tampere').isCorrect, false);
});

test('evaluateQuestionAnswer handles sequential', () => {
  const question: SequentialQuestion = {
    ...baseQuestionFields,
    question_type: 'sequential',
    question_text: aiQuestionFixtures.sequential.question,
    explanation: aiQuestionFixtures.sequential.explanation,
    items: aiQuestionFixtures.sequential.items,
    correct_order: aiQuestionFixtures.sequential.correct_order,
  };

  assert.equal(evaluateQuestionAnswer(question, [0, 1, 2]).isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, [2, 1, 0]).isCorrect, false);
});

test('evaluateQuestionAnswer handles flashcard', () => {
  const question: FlashcardQuestion = {
    ...baseQuestionFields,
    question_type: 'flashcard',
    question_text: aiQuestionFixtures.flashcard.question,
    explanation: aiQuestionFixtures.flashcard.explanation,
    correct_answer: aiQuestionFixtures.flashcard.correct_answer,
  };

  assert.equal(evaluateQuestionAnswer(question, 'Helsinki').isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, 'Turku').isCorrect, false);
});
