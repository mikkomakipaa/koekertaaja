import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aiQuestionSchema } from '../src/lib/validation/schemas';
import { aiQuestionFixtures } from './fixtures/question-types';

/**
 * Regression tests for topic/subtopic validation
 *
 * These tests ensure that:
 * 1. All AI-generated questions MUST include a non-empty "topic" field
 * 2. The "subtopic" field is optional but cannot be empty if provided
 * 3. Validation applies consistently across all question types
 */

const { topic: _topic, ...baseMultipleChoiceQuestion } = aiQuestionFixtures.multiple_choice;

test('aiQuestionSchema requires topic field', () => {
  const questionWithoutTopic = {
    ...baseMultipleChoiceQuestion,
    // topic is missing - should fail validation
  };

  const result = aiQuestionSchema.safeParse(questionWithoutTopic);
  assert.equal(result.success, false, 'Should reject question without topic');

  if (!result.success) {
    const topicError = result.error.errors.find(e => e.path.includes('topic'));
    assert.ok(topicError, 'Should have error for missing topic field');
  }
});

test('aiQuestionSchema accepts valid topic field', () => {
  const questionWithTopic = {
    ...baseMultipleChoiceQuestion,
    topic: 'Matematiikka',  // Valid topic
  };

  const result = aiQuestionSchema.safeParse(questionWithTopic);
  assert.equal(result.success, true, 'Should accept question with valid topic');
  if (result.success) {
    assert.equal(result.data.topic, 'Matematiikka', 'Should preserve topic value');
  }
});

test('aiQuestionSchema rejects empty topic', () => {
  const questionWithEmptyTopic = {
    ...baseMultipleChoiceQuestion,
    topic: '',  // Empty topic - should fail
  };

  const result = aiQuestionSchema.safeParse(questionWithEmptyTopic);
  assert.equal(result.success, false, 'Should reject question with empty topic');

  if (!result.success) {
    const topicError = result.error.errors.find(e => e.path.includes('topic'));
    assert.ok(topicError, 'Should have error for empty topic field');
  }
});

test('aiQuestionSchema accepts optional subtopic field', () => {
  const questionWithSubtopic = {
    ...baseMultipleChoiceQuestion,
    topic: 'Matematiikka',
    subtopic: 'Peruslaskut',  // Optional subtopic
  };

  const result = aiQuestionSchema.safeParse(questionWithSubtopic);
  assert.equal(result.success, true, 'Should accept question with valid subtopic');
  if (result.success) {
    assert.equal(result.data.subtopic, 'Peruslaskut', 'Should preserve subtopic value');
  }
});

test('aiQuestionSchema accepts question without subtopic', () => {
  const questionWithoutSubtopic = {
    ...baseMultipleChoiceQuestion,
    topic: 'Matematiikka',
    // subtopic is optional - should pass
  };

  const result = aiQuestionSchema.safeParse(questionWithoutSubtopic);
  assert.equal(result.success, true, 'Should accept question without subtopic');
  if (result.success) {
    assert.equal(result.data.subtopic, undefined, 'Subtopic should be undefined when not provided');
  }
});

test('aiQuestionSchema rejects empty subtopic', () => {
  const questionWithEmptySubtopic = {
    ...baseMultipleChoiceQuestion,
    topic: 'Matematiikka',
    subtopic: '',  // Empty subtopic - should fail if provided
  };

  const result = aiQuestionSchema.safeParse(questionWithEmptySubtopic);
  assert.equal(result.success, false, 'Should reject question with empty subtopic string');

  if (!result.success) {
    const subtopicError = result.error.errors.find(e => e.path.includes('subtopic'));
    assert.ok(subtopicError, 'Should have error for empty subtopic field');
  }
});

test('aiQuestionSchema validates topic for all question types', () => {
  const { topic: _fillBlankTopic, ...fillBlankQuestion } = aiQuestionFixtures.fill_blank;
  const { topic: _trueFalseTopic, ...trueFalseQuestion } = aiQuestionFixtures.true_false;
  const { topic: _shortAnswerTopic, ...shortAnswerQuestion } = aiQuestionFixtures.short_answer;
  const { topic: _matchingTopic, ...matchingQuestion } = aiQuestionFixtures.matching;
  const { topic: _sequentialTopic, ...sequentialQuestion } = aiQuestionFixtures.sequential;

  const questionTypes = [
    fillBlankQuestion,
    trueFalseQuestion,
    shortAnswerQuestion,
    matchingQuestion,
    sequentialQuestion,
  ];

  for (const questionType of questionTypes) {
    // Without topic - should fail
    const withoutTopic = {
      ...questionType,
    };
    const resultWithoutTopic = aiQuestionSchema.safeParse(withoutTopic);
    assert.equal(
      resultWithoutTopic.success,
      false,
      `${questionType.type} should require topic field`
    );

    // With topic - should pass
    const withTopic = {
      ...questionType,
      topic: 'Test Topic',
    };
    const resultWithTopic = aiQuestionSchema.safeParse(withTopic);
    assert.equal(
      resultWithTopic.success,
      true,
      `${questionType.type} should accept valid topic field`
    );
  }
});
