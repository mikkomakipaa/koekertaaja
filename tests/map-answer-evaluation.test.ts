import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateQuestionAnswer } from '../src/lib/questions/answer-evaluation';
import type { MapQuestion } from '../src/types/questions';
import { baseMapQuestion } from './fixtures/question-types';

test('evaluateQuestionAnswer handles single_region map answers', () => {
  const question: MapQuestion = { ...baseMapQuestion };
  const correctResult = evaluateQuestionAnswer(question, 'uusimaa');
  const wrongResult = evaluateQuestionAnswer(question, 'pirkanmaa');

  assert.equal(correctResult.isCorrect, true);
  assert.equal(wrongResult.isCorrect, false);
});

test('evaluateQuestionAnswer handles multi_region map answers regardless of order', () => {
  const question: MapQuestion = {
    ...baseMapQuestion,
    options: { ...baseMapQuestion.options, inputMode: 'multi_region' },
    correct_answer: ['uusimaa', 'pirkanmaa'],
  };

  const correctResult = evaluateQuestionAnswer(question, ['pirkanmaa', 'uusimaa']);
  const wrongResult = evaluateQuestionAnswer(question, ['uusimaa']);

  assert.equal(correctResult.isCorrect, true);
  assert.equal(wrongResult.isCorrect, false);
});

test('evaluateQuestionAnswer handles text map answers using region aliases', () => {
  const question: MapQuestion = {
    ...baseMapQuestion,
    options: { ...baseMapQuestion.options, inputMode: 'text' },
    correct_answer: 'uusimaa',
  };

  const correctResult = evaluateQuestionAnswer(question, 'Uudenmaan maakunta');
  const wrongResult = evaluateQuestionAnswer(question, 'Pirkanmaa');

  assert.equal(correctResult.isCorrect, true);
  assert.equal(wrongResult.isCorrect, false);
});

test('evaluateQuestionAnswer handles text map answers when correct_answer is label', () => {
  const question: MapQuestion = {
    ...baseMapQuestion,
    options: { ...baseMapQuestion.options, inputMode: 'text' },
    correct_answer: 'Uusimaa',
  };

  const correctResult = evaluateQuestionAnswer(question, 'Uudenmaan maakunta');

  assert.equal(correctResult.isCorrect, true);
});
