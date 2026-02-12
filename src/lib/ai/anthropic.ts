import type { ClaudeModel } from './modelSelector';
import type { AIMessageContent, AIResponse } from './providerTypes';
import type { GenerateWithAIOptions } from './providerRouter';
import { generateWithAnthropicAdapter } from './provider/anthropicAdapter';

export type MessageContent = AIMessageContent;
export type AnthropicResponse = AIResponse;

export interface GenerateOptions {
  model?: ClaudeModel;
  maxTokens?: number;
}

function normalizeOptions(options: number | GenerateOptions | GenerateWithAIOptions): GenerateOptions {
  if (typeof options === 'number') {
    return { maxTokens: options };
  }

  const normalized: GenerateOptions = {
    maxTokens: options.maxTokens,
  };

  if (typeof options.model === 'string') {
    normalized.model = options.model as ClaudeModel;
  }

  return normalized;
}

export async function generateWithAnthropic(
  messages: AIMessageContent[],
  options: GenerateWithAIOptions = {}
): Promise<AIResponse> {
  return generateWithClaude(messages, options);
}

/**
 * Generate content using Claude
 */
export async function generateWithClaude(
  messages: MessageContent[],
  options: number | GenerateOptions | GenerateWithAIOptions = {}
): Promise<AnthropicResponse> {
  const parsedOptions = normalizeOptions(options);
  return generateWithAnthropicAdapter(messages, {
    model: parsedOptions.model,
    maxTokens: parsedOptions.maxTokens,
  });
}
