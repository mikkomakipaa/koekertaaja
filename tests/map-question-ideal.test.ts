import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateQuestionAnswer } from '../src/lib/questions/answer-evaluation';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { baseMapAIQuestion, baseMapQuestion } from './fixtures/question-types';
import type { MapQuestion } from '../src/types/questions';

test('map question: schema, selection, and text modes behave correctly', () => {
  const schemaResult = aiQuestionSchema.safeParse(baseMapAIQuestion);
  assert.equal(schemaResult.success, true, 'map AI schema should accept valid map question');

  const singleRegion: MapQuestion = { ...baseMapQuestion };
  const singleCorrect = evaluateQuestionAnswer(singleRegion, 'uusimaa');
  const singleWrong = evaluateQuestionAnswer(singleRegion, 'pirkanmaa');
  assert.equal(singleCorrect.isCorrect, true);
  assert.equal(singleWrong.isCorrect, false);

  const multiRegion: MapQuestion = {
    ...baseMapQuestion,
    options: { ...baseMapQuestion.options, inputMode: 'multi_region' },
    correct_answer: ['uusimaa', 'pirkanmaa'],
  };
  const multiCorrect = evaluateQuestionAnswer(multiRegion, ['pirkanmaa', 'uusimaa']);
  const multiWrong = evaluateQuestionAnswer(multiRegion, ['uusimaa']);
  assert.equal(multiCorrect.isCorrect, true);
  assert.equal(multiWrong.isCorrect, false);

  const textMode: MapQuestion = {
    ...baseMapQuestion,
    options: { ...baseMapQuestion.options, inputMode: 'text' },
    correct_answer: 'uusimaa',
  };
  const textAlias = evaluateQuestionAnswer(textMode, 'Uudenmaan maakunta');
  const textWrong = evaluateQuestionAnswer(textMode, 'Pirkanmaa');
  assert.equal(textAlias.isCorrect, true);
  assert.equal(textWrong.isCorrect, false);
});
