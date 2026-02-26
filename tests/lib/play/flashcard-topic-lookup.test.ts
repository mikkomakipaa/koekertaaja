import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Flashcard } from '@/types';
import {
  buildFlashcardTopicCounts,
  buildQuestionTopicLookup,
  filterFlashcardsByTopic,
} from '@/lib/play/flashcard-topic-lookup';

const createFlashcard = (questionId: string): Flashcard => ({
  id: `flashcard-${questionId}`,
  questionId,
  front: `Q-${questionId}`,
  back: {
    answer: 'A',
    explanation: 'E',
  },
  questionType: 'short_answer',
  originalQuestion: {
    id: questionId,
    question_set_id: 'set-1',
    question_type: 'short_answer',
    question_text: `Q-${questionId}`,
    order_index: 0,
    correct_answer: 'A',
    explanation: 'E',
  },
});

describe('flashcard topic lookup', () => {
  it('builds lookup without blank topics', () => {
    const lookup = buildQuestionTopicLookup([
      { id: 'q1', topic: 'Kertolasku' },
      { id: 'q2', topic: '' },
      { id: 'q3', topic: '  ' },
      { id: 'q4', topic: null },
      { id: 'q5', topic: 'Murtoluvut' },
    ]);

    assert.strictEqual(lookup.get('q1'), 'Kertolasku');
    assert.strictEqual(lookup.get('q2'), undefined);
    assert.strictEqual(lookup.get('q3'), undefined);
    assert.strictEqual(lookup.get('q4'), undefined);
    assert.strictEqual(lookup.get('q5'), 'Murtoluvut');
  });

  it('counts cards per topic using lookup', () => {
    const flashcards = [createFlashcard('q1'), createFlashcard('q2'), createFlashcard('q3'), createFlashcard('q4')];
    const lookup = buildQuestionTopicLookup([
      { id: 'q1', topic: 'Kertolasku' },
      { id: 'q2', topic: 'Kertolasku' },
      { id: 'q3', topic: 'Murtoluvut' },
      { id: 'q4', topic: null },
    ]);

    const counts = buildFlashcardTopicCounts(flashcards, lookup);

    assert.strictEqual(counts.get('Kertolasku'), 2);
    assert.strictEqual(counts.get('Murtoluvut'), 1);
    assert.strictEqual(counts.has(''), false);
  });

  it('filters by selected topic while preserving order', () => {
    const flashcards = [createFlashcard('q1'), createFlashcard('q2'), createFlashcard('q3')];
    const lookup = buildQuestionTopicLookup([
      { id: 'q1', topic: 'Kertolasku' },
      { id: 'q2', topic: 'Murtoluvut' },
      { id: 'q3', topic: 'Kertolasku' },
    ]);

    const allCards = filterFlashcardsByTopic(flashcards, 'ALL', lookup);
    const selectedCards = filterFlashcardsByTopic(flashcards, 'Kertolasku', lookup);

    assert.deepStrictEqual(allCards.map((card) => card.questionId), ['q1', 'q2', 'q3']);
    assert.deepStrictEqual(selectedCards.map((card) => card.questionId), ['q1', 'q3']);
  });
});
