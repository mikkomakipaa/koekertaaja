import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getModelMetadata,
  getModelMetadataByModel,
  getModelPricing,
  selectModelForTask,
} from '../../src/lib/ai/modelSelector';

test('selectModelForTask keeps default Claude mapping for topic identification', () => {
  const selection = selectModelForTask('topic_identification');
  assert.deepEqual(selection, {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
  });
});

test('selectModelForTask keeps default Claude mapping for question generation', () => {
  const selection = selectModelForTask('question_generation');
  assert.deepEqual(selection, {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
  });
});

test('selectModelForTask keeps default Claude mapping for flashcard creation', () => {
  const standardSelection = selectModelForTask('flashcard_creation', { isConceptual: false });
  assert.deepEqual(standardSelection, {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
  });

  const conceptualSelection = selectModelForTask('flashcard_creation', { isConceptual: true });
  assert.deepEqual(conceptualSelection, {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
  });
});

test('selectModelForTask keeps default Claude mapping for visual questions', () => {
  const selection = selectModelForTask('visual_questions');
  assert.deepEqual(selection, {
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
  });
});

test('selectModelForTask supports OpenAI mappings when explicitly targeted', () => {
  const topicSelection = selectModelForTask('topic_identification', { targetProvider: 'openai' });
  assert.deepEqual(topicSelection, {
    provider: 'openai',
    model: 'gpt-5-mini',
  });

  const questionSelection = selectModelForTask('question_generation', { targetProvider: 'openai' });
  assert.deepEqual(questionSelection, {
    provider: 'openai',
    model: 'gpt-5-mini',
  });

  const visualSelection = selectModelForTask('visual_questions', { targetProvider: 'openai' });
  assert.deepEqual(visualSelection, {
    provider: 'openai',
    model: 'gpt-5.1',
  });
});

test('getModelPricing returns pricing metadata for Anthropic and OpenAI models', () => {
  assert.deepEqual(getModelPricing('claude-sonnet-4-6-20250514'), {
    input: 3,
    output: 15,
  });

  assert.deepEqual(getModelPricing('gpt-5-mini'), {
    input: 0.25,
    output: 2,
  });
});

test('getModelMetadata and getModelMetadataByModel include provider and name', () => {
  const anthropicMetadata = getModelMetadataByModel('claude-haiku-4-5-20251001');
  assert.deepEqual(anthropicMetadata, {
    provider: 'anthropic',
    model: 'claude-haiku-4-5-20251001',
    name: 'Haiku 4.5',
    pricing: {
      input: 0.8,
      output: 4,
    },
  });

  const openAiSelectionMetadata = getModelMetadata({
    provider: 'openai',
    model: 'gpt-5-mini',
  });
  assert.deepEqual(openAiSelectionMetadata, {
    provider: 'openai',
    model: 'gpt-5-mini',
    name: 'GPT-5 mini',
    pricing: {
      input: 0.25,
      output: 2,
    },
  });
});
