import type { AIMessageContent, AIResponse } from './providerTypes';
import type { GenerateWithAIOptions } from './providerRouter';
import { generateWithOpenAIAdapter } from './provider/openaiAdapter';

export type OpenAIResponse = AIResponse;

interface GenerateOptions {
  model?: string;
  maxTokens?: number;
}

function normalizeOptions(options: GenerateWithAIOptions): GenerateOptions {
  return {
    model: options.model,
    maxTokens: options.maxTokens,
  };
}

export async function generateWithOpenAI(
  messages: AIMessageContent[],
  options: GenerateWithAIOptions = {}
): Promise<AIResponse> {
  const parsedOptions = normalizeOptions(options);

  return generateWithOpenAIAdapter(messages, {
    model: parsedOptions.model,
    maxTokens: parsedOptions.maxTokens,
  });
}

