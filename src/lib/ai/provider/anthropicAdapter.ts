import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';
import type { ClaudeModel } from '../modelSelector';
import { AIProviderError, type AIErrorCategory, type AIMessageContent, type AIResponse } from '../providerTypes';

export interface AnthropicAdapterOptions {
  model?: ClaudeModel;
  maxTokens?: number;
}

type AnthropicMessagesClient = {
  messages: Anthropic['messages'];
};

interface AnthropicAdapterDependencies {
  client?: AnthropicMessagesClient;
  logger?: ReturnType<typeof createLogger>;
}

const defaultLogger = createLogger({ module: 'anthropic' });
const PROVIDER = 'anthropic' as const;

let defaultClient: AnthropicMessagesClient | undefined;

function getDefaultClient(): AnthropicMessagesClient {
  if (defaultClient) {
    return defaultClient;
  }

  defaultClient = new Anthropic({
    apiKey: getServerEnv().ANTHROPIC_API_KEY,
    timeout: 290000, // ~4.8 minutes to align with 5 minute route maxDuration
    maxRetries: 2, // Retry failed requests twice
  });

  return defaultClient;
}

export function createAnthropicAdapter(dependencies: AnthropicAdapterDependencies = {}) {
  const logger = dependencies.logger ?? defaultLogger;

  return async function generateWithAnthropicAdapter(
    messages: AIMessageContent[],
    options: AnthropicAdapterOptions = {}
  ): Promise<AIResponse> {
    const client = dependencies.client ?? getDefaultClient();
    const model = options.model ?? 'claude-sonnet-4-5-20250929';
    const maxTokens = options.maxTokens ?? 16000;
    const startedAt = Date.now();

    try {
      logger.info(
        {
          provider: PROVIDER,
          messageCount: messages.length,
          maxTokens,
          model,
        },
        'Calling Anthropic API'
      );

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: 'user',
            content: messages as any,
          },
        ],
      });

      logger.info(
        {
          provider: PROVIDER,
          model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          latencyMs: Date.now() - startedAt,
        },
        'Anthropic API call successful'
      );

      const textContent = response.content
        .filter((item) => item.type === 'text')
        .map((item) => ('text' in item ? item.text : ''))
        .join('');

      return {
        content: textContent,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      const category: AIErrorCategory = categorizeAnthropicError(error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const statusCode = error instanceof Anthropic.APIError ? error.status : undefined;
      const userMessage = toUserSafeErrorMessage(category, errorMessage);

      logger.error(
        {
          provider: PROVIDER,
          model,
          errorCategory: category,
          statusCode,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage,
          latencyMs: Date.now() - startedAt,
          stack: process.env.NODE_ENV === 'production' || !(error instanceof Error) ? undefined : error.stack,
        },
        'Anthropic API error'
      );

      throw new AIProviderError({
        provider: PROVIDER,
        model,
        category,
        statusCode,
        message: userMessage,
        cause: error,
      });
    }
  };
}

export const generateWithAnthropicAdapter = createAnthropicAdapter();

function categorizeAnthropicError(error: unknown): AIErrorCategory {
  if (error instanceof Anthropic.APIError) {
    const status = error.status;

    if (status === 401) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status === 400) return 'invalid_request';
    if (status === 413) return 'request_too_large';
    if (status === 500 || status === 502 || status === 503 || status === 504) return 'provider_unavailable';
  }

  if (error instanceof Error) {
    const name = error.name.toLowerCase();
    const message = error.message.toLowerCase();
    if (name.includes('timeout') || message.includes('timeout')) return 'timeout';
    if (name.includes('network') || message.includes('network') || message.includes('econnreset')) return 'network';
  }

  return 'unknown';
}

function toUserSafeErrorMessage(category: AIErrorCategory, fallback: string): string {
  if (category === 'auth') {
    return 'Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.';
  }
  if (category === 'rate_limit') {
    return 'Rate limit exceeded. Please try again in a few moments.';
  }
  if (category === 'invalid_request') {
    return 'Invalid request format. Please check your input and try again.';
  }
  if (category === 'request_too_large') {
    return 'Request too large. Please reduce the size of your materials.';
  }
  if (category === 'provider_unavailable') {
    return 'Anthropic API is temporarily unavailable. Please try again later.';
  }

  return `Failed to generate content with AI: ${fallback}`;
}
