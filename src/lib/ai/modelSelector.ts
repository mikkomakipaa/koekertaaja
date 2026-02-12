import { Subject } from '@/types';
import type { AIModelSelection, AIProvider } from './providerTypes';

export type ClaudeModel =
  | 'claude-haiku-4-5-20251001'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-6-20250514';

export type OpenAIModel =
  | 'gpt-5-nano'
  | 'gpt-5-mini'
  | 'gpt-5.1';

export type AIModel = ClaudeModel | OpenAIModel;

export const AI_MODEL_VALUES = [
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-6-20250514',
  'gpt-5-nano',
  'gpt-5-mini',
  'gpt-5.1',
] as const;

export type AITask =
  | 'topic_identification'
  | 'question_generation'
  | 'flashcard_creation'
  | 'visual_questions';

export interface ModelSelectionOptions {
  subject?: Subject;
  hasVisuals?: boolean;
  isConceptual?: boolean;
  targetProvider?: AIProvider;
}

/**
 * Select provider and model by task.
 * Defaults remain Anthropic to preserve current behavior.
 */
export function selectModelForTask(
  task: AITask,
  options: ModelSelectionOptions = {}
): AIModelSelection {
  const { isConceptual, targetProvider = 'anthropic' } = options;

  if (targetProvider === 'openai') {
    switch (task) {
      case 'topic_identification':
        return { provider: 'openai', model: 'gpt-5-mini' };
      case 'question_generation':
        return { provider: 'openai', model: 'gpt-5-mini' };
      case 'flashcard_creation':
        if (isConceptual) {
          return { provider: 'openai', model: 'gpt-5.1' };
        }
        return { provider: 'openai', model: 'gpt-5-mini' };
      case 'visual_questions':
        return { provider: 'openai', model: 'gpt-5.1' };
      default:
        return { provider: 'openai', model: 'gpt-5-mini' };
    }
  }

  switch (task) {
    case 'topic_identification':
      // Haiku is fast and accurate for pattern matching
      return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' };

    case 'question_generation':
      // Sonnet for best quality-cost balance
      return { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' };

    case 'flashcard_creation':
      // Use Sonnet for conceptual flashcards, Haiku for standard
      if (isConceptual) {
        return { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' };
      }
      return { provider: 'anthropic', model: 'claude-haiku-4-5-20251001' };

    case 'visual_questions':
      // Sonnet has vision support
      return { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' };

    default:
      return { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' };
  }
}

export interface ModelPricing {
  input: number;
  output: number;
}

export interface ModelMetadata {
  provider: AIProvider;
  model: AIModel;
  name: string;
  pricing: ModelPricing;
}

export function getModelPricing(model: AIModel): ModelPricing {
  return getModelMetadataByModel(model).pricing;
}

export function isAIModel(value: string): value is AIModel {
  return (AI_MODEL_VALUES as readonly string[]).includes(value);
}

export function getProviderForModel(model: AIModel): AIProvider {
  return getModelMetadataByModel(model).provider;
}

export function getModelMetadataByModel(model: AIModel): ModelMetadata {
  switch (model) {
    case 'claude-haiku-4-5-20251001':
      return {
        provider: 'anthropic',
        model,
        name: 'Haiku 4.5',
        pricing: { input: 0.8, output: 4 },
      };
    case 'claude-sonnet-4-5-20250929':
      return {
        provider: 'anthropic',
        model,
        name: 'Sonnet 4.5',
        pricing: { input: 3, output: 15 },
      };
    case 'claude-opus-4-6-20250514':
      return {
        provider: 'anthropic',
        model,
        name: 'Opus 4.6',
        pricing: { input: 15, output: 75 },
      };
    case 'gpt-5-nano':
      return {
        provider: 'openai',
        model,
        name: 'GPT-5 nano',
        pricing: { input: 0.05, output: 0.4 },
      };
    case 'gpt-5-mini':
      return {
        provider: 'openai',
        model,
        name: 'GPT-5 mini',
        pricing: { input: 0.25, output: 2 },
      };
    case 'gpt-5.1':
      return {
        provider: 'openai',
        model,
        name: 'GPT-5.1',
        pricing: { input: 1.25, output: 10 },
      };
  }
}

export function getModelMetadata(selection: AIModelSelection): ModelMetadata {
  const metadata = getModelMetadataByModel(selection.model as AIModel);

  if (metadata.provider === selection.provider) {
    return metadata;
  }

  return {
    ...metadata,
    provider: selection.provider,
  };
}
