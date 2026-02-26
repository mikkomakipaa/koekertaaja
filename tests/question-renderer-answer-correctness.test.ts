import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { FillBlank } from '@/components/questions/FillBlank';
import { ShortAnswer } from '@/components/questions/ShortAnswer';
import { evaluateQuestionAnswer } from '@/lib/questions/answer-evaluation';
import type { FillBlankQuestion, ShortAnswerQuestion } from '@/types';

const baseQuestion = {
  id: 'q-1',
  question_set_id: 'set-1',
  question_text: 'Mikä on ilmiön nimi?',
  explanation: 'Selitys',
  order_index: 1,
};

describe('QuestionRenderer answer correctness alignment', () => {
  it('shows fill_blank as correct when centralized evaluation accepts lenient match', () => {
    const question: FillBlankQuestion = {
      ...baseQuestion,
      question_type: 'fill_blank',
      correct_answer: 'fotosynteesi',
    };
    const userAnswer = 'fotosynteesi prosessi';
    const evaluation = evaluateQuestionAnswer(question, userAnswer);

    assert.equal(evaluation.isCorrect, true);

    const html = renderToString(
      createElement(FillBlank, {
        question,
        userAnswer,
        showExplanation: true,
        isAnswerCorrect: evaluation.isCorrect,
        onAnswerChange: () => {},
      })
    );

    assert.ok(html.includes('text-green-600'));
    assert.equal(html.includes('Oikea vastaus:'), false);
  });

  it('shows short_answer as correct when centralized evaluation accepts lenient match', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestion,
      question_type: 'short_answer',
      correct_answer: 'fotosynteesi',
    };
    const userAnswer = 'fotosynteesi prosessi';
    const evaluation = evaluateQuestionAnswer(question, userAnswer);

    assert.equal(evaluation.isCorrect, true);

    const html = renderToString(
      createElement(ShortAnswer, {
        question,
        userAnswer,
        showExplanation: true,
        isAnswerCorrect: evaluation.isCorrect,
        onAnswerChange: () => {},
      })
    );

    assert.ok(html.includes('text-green-600'));
    assert.equal(html.includes('Tarkista'), false);
  });
});
