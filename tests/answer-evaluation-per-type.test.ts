import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateQuestionAnswer } from '../src/lib/questions/answer-evaluation';
import type {
  FillBlankQuestion,
  MatchingQuestion,
  MultipleChoiceQuestion,
  MultipleSelectQuestion,
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

test('evaluateQuestionAnswer handles multiple_select with all-or-nothing scoring', () => {
  const question: MultipleSelectQuestion = {
    ...baseQuestionFields,
    question_type: 'multiple_select',
    question_text: aiQuestionFixtures.multiple_select.question,
    explanation: aiQuestionFixtures.multiple_select.explanation,
    options: aiQuestionFixtures.multiple_select.options,
    correct_answers: aiQuestionFixtures.multiple_select.correct_answers,
  };

  assert.equal(evaluateQuestionAnswer(question, ['2', '3', '11']).isCorrect, true);
  assert.equal(evaluateQuestionAnswer(question, ['2', '3']).isCorrect, false);
  assert.equal(evaluateQuestionAnswer(question, ['2', '3', '4']).isCorrect, false);
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

test('evaluateQuestionAnswer accepts equivalent fraction and mixed-number forms', () => {
  const question: ShortAnswerQuestion = {
    ...baseQuestionFields,
    question_type: 'short_answer',
    question_text: 'Muunna sekaluku 1 1/3 murtoluvuksi.',
    correct_answer: '4/3',
    acceptable_answers: ['1 1/3'],
  };

  const mixedNumberEvaluation = evaluateQuestionAnswer(question, '1 1/3', 5, 'math');
  assert.equal(mixedNumberEvaluation.isCorrect, true);
  assert.equal(mixedNumberEvaluation.matchType, 'numerical');
  assert.equal(mixedNumberEvaluation.diagnostics?.acceptedEquivalentForm, true);
  assert.equal(mixedNumberEvaluation.diagnostics?.notationFrictionSignal, 'accepted_equivalent');
  assert.equal(mixedNumberEvaluation.diagnostics?.userNotation, 'mixed_number');
  assert.deepEqual(mixedNumberEvaluation.diagnostics?.expectedNotations, ['fraction', 'mixed_number']);

  const improperFractionEvaluation = evaluateQuestionAnswer(question, '4/3', 5, 'math');
  assert.equal(improperFractionEvaluation.isCorrect, true);
  assert.equal(improperFractionEvaluation.diagnostics?.acceptedEquivalentForm, false);
  assert.equal(improperFractionEvaluation.diagnostics?.notationFrictionSignal, 'none');
});

test('evaluateQuestionAnswer accepts plain fraction input for LaTeX fraction answers', () => {
  const question: FillBlankQuestion = {
    ...baseQuestionFields,
    question_type: 'fill_blank',
    question_text: 'Supista murtoluku 10/15.',
    correct_answer: '$$\\frac{2}{3}$$',
    acceptable_answers: [],
  };

  const evaluation = evaluateQuestionAnswer(question, '2/3', 5, 'math');

  assert.equal(evaluation.isCorrect, true);
  assert.equal(evaluation.matchType, 'exact');
});

test('evaluateQuestionAnswer keeps decimal and percentage variants equivalent', () => {
  const percentQuestion: FillBlankQuestion = {
    ...baseQuestionFields,
    question_type: 'fill_blank',
    question_text: 'Kirjoita desimaalina 25 %.',
    correct_answer: '0,25',
    acceptable_answers: ['25%', '1/4'],
  };

  const percentAsFraction = evaluateQuestionAnswer(percentQuestion, '1/4', 5, 'math');
  assert.equal(percentAsFraction.isCorrect, true);
  assert.equal(percentAsFraction.matchType, 'numerical');
  assert.equal(percentAsFraction.diagnostics?.acceptedEquivalentForm, true);
  assert.equal(percentAsFraction.diagnostics?.userNotation, 'fraction');

  const percentAsPercent = evaluateQuestionAnswer(percentQuestion, '25%', 5, 'math');
  assert.equal(percentAsPercent.isCorrect, true);
  assert.equal(percentAsPercent.matchType, 'numerical');
  assert.equal(percentAsPercent.diagnostics?.userNotation, 'percentage');
});

test('evaluateQuestionAnswer flags likely format issues separately from content misunderstandings', () => {
  const question: FillBlankQuestion = {
    ...baseQuestionFields,
    question_type: 'fill_blank',
    question_text: 'Kirjoita murtolukuna yksi ja yksi kolmasosa.',
    correct_answer: '4/3',
    acceptable_answers: ['1 1/3'],
  };

  const malformedAttempt = evaluateQuestionAnswer(question, '1//3', 5, 'math');
  assert.equal(malformedAttempt.isCorrect, false);
  assert.equal(malformedAttempt.diagnostics?.notationFrictionSignal, 'likely_format_issue');
  assert.equal(malformedAttempt.diagnostics?.userNotation, 'other');

  const wrongMathAttempt = evaluateQuestionAnswer(question, '5/3', 5, 'math');
  assert.equal(wrongMathAttempt.isCorrect, false);
  assert.equal(wrongMathAttempt.diagnostics?.notationFrictionSignal, 'content_misunderstanding');
  assert.equal(wrongMathAttempt.diagnostics?.userNotation, 'fraction');
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
