import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calcQuestionsPerTopic } from '@/config/generationConfig';
import {
  getTopicConfirmationPreview,
  isTopicConfirmationDisabled,
} from '@/components/create/TopicConfirmationDialog';

describe('calcQuestionsPerTopic', () => {
  it('returns 10 for standard 30-concept 3-topic material', () => {
    assert.equal(calcQuestionsPerTopic(30, 3), 10);
  });

  it('floors thin 3-topic material to 6', () => {
    assert.equal(calcQuestionsPerTopic(10, 3), 6);
  });

  it('caps dense 3-topic material at 15', () => {
    assert.equal(calcQuestionsPerTopic(90, 3), 15);
  });

  it('floors thin 2-topic material to 6', () => {
    assert.equal(calcQuestionsPerTopic(10, 2), 6);
  });

  it('caps 45-concept 3-topic material at 15', () => {
    assert.equal(calcQuestionsPerTopic(45, 3), 15);
  });

  it('returns the direct ratio when already within bounds', () => {
    assert.equal(calcQuestionsPerTopic(40, 5), 8);
  });
});

describe('TopicConfirmationDialog', () => {
  it('derives the quiz preview totals from selected topic count and concept count', () => {
    const preview = getTopicConfirmationPreview(30, 3, 'quiz', 10);

    assert.deepEqual(preview, {
      questionsPerTopic: 10,
      totalPerMode: 30,
      totalCombined: 30,
      estimatedRounds: 3,
    });
  });

  it('doubles the combined total when both quiz and flashcard modes are enabled', () => {
    const preview = getTopicConfirmationPreview(30, 3, 'both', 10);

    assert.deepEqual(preview, {
      questionsPerTopic: 10,
      totalPerMode: 30,
      totalCombined: 60,
      estimatedRounds: 3,
    });
  });

  it('keeps the at-least-one-topic invariant by disabling confirmation at zero selected topics', () => {
    assert.equal(isTopicConfirmationDisabled(0), true);
    assert.equal(isTopicConfirmationDisabled(1), false);

    assert.deepEqual(getTopicConfirmationPreview(30, 0, 'quiz', 10), {
      questionsPerTopic: 0,
      totalPerMode: 0,
      totalCombined: 0,
      estimatedRounds: 0,
    });
  });
});

/**
 * Manual integration checklist for Part B creation-flow verification:
 * - 3-topic set with 30 concepts -> expect 30 questions in bank (3 x 10).
 * - 3-topic set with 45 concepts -> expect 45 questions in bank (3 x 15, capped).
 * - mode='both', 3 topics, 30 concepts -> expect 30 quiz + 30 flashcard.
 * - topic-batch path should no longer chunk above the per-topic range, or
 *   chunkQuestionCounts should return [Q] for every calcQuestionsPerTopic(...)
 *   output in the inclusive range [6, 15].
 */
