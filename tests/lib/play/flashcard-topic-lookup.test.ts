import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Flashcard } from '@/types';
import {
  ALL_TOPICS,
  QUIZ_TOPIC_SELECTOR_QUERY_PARAM,
  buildAvailableTopics,
  buildFlashcardTopicCounts,
  buildQuizTopicSelectorHref,
  buildStudyTopicHref,
  buildTopicCounts,
  buildTopicCountsFromDistribution,
  buildQuestionTopicLookup,
  filterQuestionsByTopic,
  filterFlashcardsByTopic,
  hasMultipleTopicOptions,
  resolveRequestedTopic,
  shouldShowQuizTopicSelector,
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
      { id: 'q1b', topic: '  Nouns and Articles  ' },
      { id: 'q2', topic: '' },
      { id: 'q3', topic: '  ' },
      { id: 'q4', topic: null },
      { id: 'q5', topic: 'Murtoluvut' },
    ]);

    assert.strictEqual(lookup.get('q1'), 'Kertolasku');
    assert.strictEqual(lookup.get('q1b'), 'Substantiivit ja artikkelit');
    assert.strictEqual(lookup.get('q2'), undefined);
    assert.strictEqual(lookup.get('q3'), undefined);
    assert.strictEqual(lookup.get('q4'), undefined);
    assert.strictEqual(lookup.get('q5'), 'Murtoluvut');
  });

  it('builds normalized available topics without duplicates', () => {
    const topics = buildAvailableTopics([
      { id: 'q1', topic: 'Nouns and Articles' },
      { id: 'q2', topic: 'Substantiivit ja artikkelit' },
      { id: 'q3', topic: 'Murtoluvut' },
      { id: 'q4', topic: '' },
      { id: 'q5', topic: null },
    ]);

    assert.deepStrictEqual(topics, ['Substantiivit ja artikkelit', 'Murtoluvut']);
  });

  it('resolves only valid normalized requested topics', () => {
    const topics = ['Substantiivit ja artikkelit', 'Murtoluvut'];

    assert.strictEqual(resolveRequestedTopic(topics, 'nouns & articles'), 'Substantiivit ja artikkelit');
    assert.strictEqual(resolveRequestedTopic(topics, 'Tuntematon aihe'), null);
    assert.strictEqual(resolveRequestedTopic(topics, null), null);
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

  it('counts normalized quiz questions per topic', () => {
    const counts = buildTopicCounts([
      { id: 'q1', topic: 'Nouns and Articles' },
      { id: 'q2', topic: 'Substantiivit ja artikkelit' },
      { id: 'q3', topic: 'Murtoluvut' },
      { id: 'q4', topic: null },
    ]);

    assert.strictEqual(counts.get('Substantiivit ja artikkelit'), 2);
    assert.strictEqual(counts.get('Murtoluvut'), 1);
  });

  it('uses topic distribution summaries to detect selector visibility on browse cards', () => {
    const counts = buildTopicCountsFromDistribution({
      'Nouns and Articles': 3,
      'Substantiivit ja artikkelit': 2,
      Murtoluvut: 4,
    });

    assert.strictEqual(counts.get('Substantiivit ja artikkelit'), 5);
    assert.strictEqual(hasMultipleTopicOptions(counts), true);
    assert.strictEqual(hasMultipleTopicOptions({ Murtoluvut: 7 }), false);
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

  it('keeps quiz question pools unchanged for all-topic fallback and filters only valid selected topics', () => {
    const questions = [
      { id: 'q1', topic: 'Nouns and Articles' },
      { id: 'q2', topic: 'Murtoluvut' },
      { id: 'q3', topic: 'Substantiivit ja artikkelit' },
    ];
    const topics = buildAvailableTopics(questions);
    const validSelectedTopic = resolveRequestedTopic(topics, 'Substantiivit ja artikkelit');
    const invalidSelectedTopic = resolveRequestedTopic(topics, 'Vanhentunut aihe');

    const defaultPool = filterQuestionsByTopic(questions, null);
    const allTopicsPool = filterQuestionsByTopic(questions, ALL_TOPICS);
    const invalidFallbackPool = filterQuestionsByTopic(questions, invalidSelectedTopic);
    const filteredPool = filterQuestionsByTopic(questions, validSelectedTopic);

    assert.deepStrictEqual(defaultPool.map((question) => question.id), ['q1', 'q2', 'q3']);
    assert.deepStrictEqual(allTopicsPool.map((question) => question.id), ['q1', 'q2', 'q3']);
    assert.deepStrictEqual(invalidFallbackPool.map((question) => question.id), ['q1', 'q2', 'q3']);
    assert.deepStrictEqual(filteredPool.map((question) => question.id), ['q1', 'q3']);
  });

  it('builds all-topics hrefs without topic scoping and topic-specific hrefs with canonical query params', () => {
    assert.strictEqual(buildStudyTopicHref('QUIZ01', 'pelaa', null), '/play/QUIZ01?mode=pelaa');
    assert.strictEqual(buildStudyTopicHref('QUIZ01', 'pelaa', ALL_TOPICS), '/play/QUIZ01?mode=pelaa');
    assert.strictEqual(
      buildStudyTopicHref('QUIZ01', 'pelaa', 'Substantiivit ja artikkelit'),
      '/play/QUIZ01?mode=pelaa&topic=Substantiivit+ja+artikkelit'
    );
  });

  it('builds explicit quiz topic-selector entry hrefs on the existing play route', () => {
    assert.strictEqual(
      buildQuizTopicSelectorHref('QUIZ01'),
      `/play/QUIZ01?mode=pelaa&${QUIZ_TOPIC_SELECTOR_QUERY_PARAM}=1`
    );
  });

  it('shows quiz topic selector only when explicitly requested and multiple topics exist', () => {
    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 2,
        isAikahaaste: false,
        isReviewMode: false,
        selectorRequested: true,
        studyMode: 'pelaa',
      }),
      true
    );

    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 1,
        isAikahaaste: false,
        isReviewMode: false,
        selectorRequested: true,
        studyMode: 'pelaa',
      }),
      false
    );
  });

  it('keeps quiz topic selector disabled for v1 unsupported combinations and non-quiz modes', () => {
    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 3,
        isAikahaaste: true,
        isReviewMode: false,
        selectorRequested: true,
        studyMode: 'pelaa',
      }),
      false
    );

    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 3,
        isAikahaaste: false,
        isReviewMode: true,
        selectorRequested: true,
        studyMode: 'pelaa',
      }),
      false
    );

    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 3,
        isAikahaaste: false,
        isReviewMode: false,
        selectorRequested: true,
        studyMode: 'opettele',
      }),
      false
    );

    assert.strictEqual(
      shouldShowQuizTopicSelector({
        availableTopicCount: 3,
        isAikahaaste: false,
        isReviewMode: false,
        selectorRequested: false,
        studyMode: 'pelaa',
      }),
      false
    );
  });
});
