import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { FlashcardCard, getFlashcardCardAriaLabel } from '@/components/play/FlashcardCard';
import { getFlashcardPrimaryAction } from '@/components/play/FlashcardSession';
import type { Flashcard } from '@/types';

const flashcard: Flashcard = {
  id: 'flashcard-1',
  questionId: 'question-1',
  front: 'Mikä on Suomen pääkaupunki?',
  back: {
    answer: 'Helsinki',
    explanation: 'Helsinki on Suomen pääkaupunki.',
  },
  questionType: 'flashcard',
  originalQuestion: {
    id: 'question-1',
    question_set_id: 'set-1',
    question_text: 'Mikä on Suomen pääkaupunki?',
    question_type: 'flashcard',
    explanation: 'Helsinki on Suomen pääkaupunki.',
    order_index: 0,
    correct_answer: 'Helsinki',
  },
};

describe('flashcard session interaction', () => {
  it('keeps the first card tap on reveal-answer behavior', () => {
    assert.equal(getFlashcardPrimaryAction(false), 'reveal');
    assert.equal(getFlashcardCardAriaLabel(false), 'Näytä vastaus');

    const html = renderToString(
      createElement(FlashcardCard, {
        flashcard,
        isFlipped: false,
        onPrimaryAction: () => {},
        onShowAnswer: () => {},
        onShowQuestion: () => {},
      })
    );

    assert.ok(html.includes('aria-label="Näytä vastaus"'));
    assert.ok(html.includes('Näytä vastaus'));
  });

  it('advances to the next flashcard on the next tap after reveal', () => {
    assert.equal(getFlashcardPrimaryAction(true), 'advance');
    assert.equal(getFlashcardCardAriaLabel(true), 'Siirry seuraavaan korttiin');

    const html = renderToString(
      createElement(FlashcardCard, {
        flashcard,
        isFlipped: true,
        onPrimaryAction: () => {},
        onShowAnswer: () => {},
        onShowQuestion: () => {},
      })
    );

    assert.ok(html.includes('aria-label="Siirry seuraavaan korttiin"'));
    assert.ok(html.includes('Muista tämä:'));
    assert.ok(html.includes('Näytä kysymys'));
    assert.ok(!html.includes('Oikea vastaus:'));
  });
});
