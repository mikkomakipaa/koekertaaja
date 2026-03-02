import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToString } from 'react-dom/server';
import { ShortAnswer } from '../src/components/questions/ShortAnswer';
import { FillBlank } from '../src/components/questions/FillBlank';
import { getAnswerEntryConfig } from '../src/lib/questions/answer-entry';
import type { FillBlankQuestion, ShortAnswerQuestion } from '../src/types/questions';

const baseQuestionFields = {
  id: 'question-1',
  question_set_id: 'set-1',
  explanation: 'Selitys.',
  order_index: 0,
  topic: 'Murtoluvut',
};

describe('fraction answer entry rendering', () => {
  it('renders LaTeX notation hints without leaking raw delimiters before submit', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Muunna sekaluku murtoluvuksi.',
      correct_answer: '$$\\frac{4}{3}$$',
      acceptable_answers: ['$$1\\frac{1}{3}$$'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(
      answerEntryConfig.notationHint,
      'Kirjoita vastaus murtolukuna muodossa 3/4. Voit kirjoittaa myös sekalukuna, esimerkiksi 1 1/2.'
    );
    assert.ok(html.includes('data-testid="answer-notation-hint"'));
    assert.ok(html.includes('Kirjoitusvinkki'));
    assert.ok(!html.includes('$$\\frac{4}{3}$$'));
    assert.ok(!html.includes('$$1\\frac{1}{3}$$'));
  });

  it('renders a compact single-line input and notation hint for fraction short answers', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Muunna sekaluku 1 1/3 murtoluvuksi.',
      correct_answer: '4/3',
      acceptable_answers: ['1 1/3'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(answerEntryConfig.variant, 'compact');
    assert.equal(answerEntryConfig.isStructuredMath, true);
    assert.equal(
      answerEntryConfig.notationHint,
      'Kirjoita vastaus murtolukuna muodossa 3/4. Voit kirjoittaa myös sekalukuna, esimerkiksi 1 1/2.'
    );
    assert.ok(html.includes('Kirjoitusvinkki'));
    assert.ok(html.includes('data-testid="answer-notation-hint"'));
    assert.ok(html.includes('placeholder="Esim. 3/4"'));
    assert.ok(html.includes('data-testid="compact-answer-input"'));
    assert.ok(!html.includes('<textarea'));
  });

  it('keeps prose short answers on the generic textarea path', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Miksi kasvit tarvitsevat auringonvaloa?',
      correct_answer: 'Kasvit tarvitsevat auringonvaloa yhteyttämiseen.',
      acceptable_answers: ['Yhteyttämiseen ja ravinnon valmistamiseen.'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(answerEntryConfig.variant, 'freeform');
    assert.equal(answerEntryConfig.isStructuredMath, false);
    assert.ok(html.includes('placeholder="Kirjoita omin sanoin (1-3 lausetta)"'));
    assert.ok(html.includes('data-testid="freeform-answer-input"'));
    assert.ok(!html.includes('Kirjoitusvinkki'));
  });

  it('shows notation guidance for fill-in fraction answers before submit', () => {
    const question: FillBlankQuestion = {
      ...baseQuestionFields,
      question_type: 'fill_blank',
      question_text: 'Kirjoita murtolukuna: yksi ja yksi neljäsosa.',
      correct_answer: '5/4',
      acceptable_answers: ['1 1/4'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <FillBlank
        question={question}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(answerEntryConfig.variant, 'compact');
    assert.equal(
      answerEntryConfig.notationHint,
      'Kirjoita vastaus murtolukuna muodossa 3/4. Voit kirjoittaa myös sekalukuna, esimerkiksi 1 1/2.'
    );
    assert.ok(html.includes('Kirjoitusvinkki'));
    assert.ok(html.includes('data-testid="answer-notation-hint"'));
    assert.ok(html.includes('placeholder="Esim. 3/4"'));
    assert.ok(html.includes('data-testid="compact-answer-input"'));
  });

  it('keeps notation feedback visible after an incorrect structured math answer', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Muunna sekaluku 1 1/3 murtoluvuksi.',
      correct_answer: '4/3',
      acceptable_answers: ['1 1/3'],
    };

    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer="5/3"
        showExplanation
        isAnswerCorrect={false}
        onAnswerChange={() => {}}
        answerEntryConfig={getAnswerEntryConfig(question)}
      />
    );

    assert.ok(html.includes('data-testid="answer-feedback-hint"'));
    assert.ok(html.includes('Kirjoitusapu'));
  });

  it('renders LaTeX notation hints with MathText and keeps the compact placeholder plain text', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Kirjoita murtolukuna.',
      correct_answer: '$$\\frac{4}{3}$$',
      acceptable_answers: ['$$1\\frac{1}{3}$$'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(answerEntryConfig.variant, 'compact');
    assert.equal(answerEntryConfig.placeholder, 'Esim. 3/4');
    assert.ok(html.includes('data-testid="answer-notation-hint"'));
    assert.ok(html.includes('placeholder="Esim. 3/4"'));
    assert.ok(!html.includes('placeholder="Esim. $$\\frac{4}{3}$$"'));
    assert.ok(!html.includes('$$\\frac{4}{3}$$'));
  });

  it('keeps compact examples plain text when the helper copy is generated from LaTeX answers', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Kirjoita murtolukuna.',
      correct_answer: '$$\\frac{4}{3}$$',
      acceptable_answers: ['$$1\\frac{1}{3}$$'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);

    assert.equal(answerEntryConfig.variant, 'compact');
    assert.equal(answerEntryConfig.placeholder, 'Esim. 3/4');
    assert.deepEqual(answerEntryConfig.acceptedFormats, ['$$\\frac{4}{3}$$', '$$1\\frac{1}{3}$$']);
    assert.ok(!answerEntryConfig.placeholder.includes('$$'));
  });

  it('renders LaTeX feedback hints without changing non-math helper copy', () => {
    const latexQuestion: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Kirjoita murtolukuna.',
      correct_answer: '$$\\frac{4}{3}$$',
      acceptable_answers: ['$$1\\frac{1}{3}$$'],
    };

    const latexHtml = renderToString(
      <ShortAnswer
        question={latexQuestion}
        userAnswer="1/3"
        showExplanation
        isAnswerCorrect={false}
        onAnswerChange={() => {}}
        answerEntryConfig={getAnswerEntryConfig(latexQuestion)}
      />
    );

    const proseQuestion: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Miksi kasvit tarvitsevat auringonvaloa?',
      correct_answer: 'Kasvit tarvitsevat auringonvaloa yhteyttämiseen.',
      acceptable_answers: ['Yhteyttämiseen ja ravinnon valmistamiseen.'],
    };

    const proseHtml = renderToString(
      <ShortAnswer
        question={proseQuestion}
        userAnswer=""
        showExplanation={false}
        onAnswerChange={() => {}}
        answerEntryConfig={getAnswerEntryConfig(proseQuestion)}
      />
    );

    assert.ok(latexHtml.includes('data-testid="answer-feedback-hint"'));
    assert.ok(latexHtml.includes('Esimerkkivastaus:'));
    assert.ok(latexHtml.includes('Muita hyväksyttäviä vastauksia:'));
    assert.ok(latexHtml.includes('Käytä murtolukua muodossa 3/4 tai sekalukua muodossa 1 1/2.'));
    assert.ok(proseHtml.includes('placeholder="Kirjoita omin sanoin (1-3 lausetta)"'));
    assert.ok(!proseHtml.includes('data-testid="answer-notation-hint"'));
  });

  it('renders LaTeX feedback hints and example answers without raw helper leakage after submit', () => {
    const question: ShortAnswerQuestion = {
      ...baseQuestionFields,
      question_type: 'short_answer',
      question_text: 'Muunna sekaluku murtoluvuksi.',
      correct_answer: '$$\\frac{4}{3}$$',
      acceptable_answers: ['$$1\\frac{1}{3}$$'],
    };

    const answerEntryConfig = getAnswerEntryConfig(question);
    const html = renderToString(
      <ShortAnswer
        question={question}
        userAnswer="5/3"
        showExplanation
        isAnswerCorrect={false}
        onAnswerChange={() => {}}
        answerEntryConfig={answerEntryConfig}
      />
    );

    assert.equal(
      answerEntryConfig.feedbackHint,
      'Tarkista kirjoitustapa. Käytä murtolukua muodossa 3/4 tai sekalukua muodossa 1 1/2.'
    );
    assert.ok(html.includes('data-testid="answer-feedback-hint"'));
    assert.ok(html.includes('Kirjoitusapu'));
    assert.ok(html.includes('Esimerkkivastaus:'));
    assert.ok(html.includes('Muita hyväksyttäviä vastauksia:'));
    assert.ok(html.includes('Käytä murtolukua muodossa 3/4 tai sekalukua muodossa 1 1/2.'));
  });
});
