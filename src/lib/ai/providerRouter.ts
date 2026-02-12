import { createLogger } from '@/lib/logger';
import {
  isAIProviderError,
  isTransientAIError,
  type AIMessageContent,
  type AIProvider,
  type AIResponse,
} from './providerTypes';

export interface GenerateWithAIOptions {
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  allowFallback?: boolean;
}

type ProviderAdapters = {
  anthropic: (messages: AIMessageContent[], options: GenerateWithAIOptions) => Promise<AIResponse>;
  openai: (messages: AIMessageContent[], options: GenerateWithAIOptions) => Promise<AIResponse>;
};

const defaultAdapters: ProviderAdapters = {
  anthropic: async (messages, options) => {
    const { generateWithAnthropic } = await import('./anthropic');
    return generateWithAnthropic(messages, options);
  },
  openai: async (messages, options) => {
    const { generateWithOpenAI } = await import('./openai');
    return generateWithOpenAI(messages, options);
  },
};

const logger = createLogger({ module: 'providerRouter' });

/**
 * Provider-agnostic AI entrypoint. Defaults to Anthropic to preserve current behavior.
 */
export async function generateWithAI(
  messages: AIMessageContent[],
  options: GenerateWithAIOptions = {},
  adapters: ProviderAdapters = defaultAdapters
): Promise<AIResponse> {
  const provider = options.provider ?? 'anthropic';
  const model = options.model;
  const startedAt = Date.now();

  switch (provider) {
    case 'anthropic': {
      try {
        const response = await adapters.anthropic(messages, options);
        logSuccess('anthropic', model, startedAt, response);
        return response;
      } catch (error) {
        logFailure('anthropic', model, startedAt, error);

        if (shouldFallbackToOpenAI(error, options)) {
          const fallbackModel = selectOpenAIFallbackModel(model);
          const fallbackStartedAt = Date.now();
          logger.warn(
            {
              provider: 'anthropic',
              model,
              fallbackProvider: 'openai',
              fallbackModel,
              errorCategory: isAIProviderError(error) ? error.category : 'unknown',
            },
            'Triggering OpenAI fallback after Anthropic failure'
          );

          try {
            const fallbackResponse = await adapters.openai(messages, {
              ...options,
              provider: 'openai',
              model: fallbackModel,
              allowFallback: false,
            });
            logSuccess('openai', fallbackModel, fallbackStartedAt, fallbackResponse, true);
            return fallbackResponse;
          } catch (fallbackError) {
            logFailure('openai', fallbackModel, fallbackStartedAt, fallbackError, true);
          }
        }

        throw error;
      }
    }
    case 'openai': {
      try {
        const response = await adapters.openai(messages, options);
        logSuccess('openai', model, startedAt, response);
        return response;
      } catch (error) {
        logFailure('openai', model, startedAt, error);
        throw error;
      }
    }
    default:
      throw new Error(`AI provider "${provider}" is not implemented`);
  }
}

function shouldFallbackToOpenAI(error: unknown, options: GenerateWithAIOptions): boolean {
  const fallbackEnabled = (options.allowFallback ?? true) && process.env.AI_ENABLE_OPENAI?.trim().toLowerCase() === 'true';
  return fallbackEnabled && isTransientAIError(error);
}

function selectOpenAIFallbackModel(primaryModel?: string): string {
  if (!primaryModel) return 'gpt-5-mini';
  if (primaryModel.includes('haiku')) return 'gpt-5-nano';
  if (primaryModel.includes('sonnet') || primaryModel.includes('opus')) return 'gpt-5-mini';
  return 'gpt-5-mini';
}

function logSuccess(
  provider: AIProvider,
  model: string | undefined,
  startedAt: number,
  response: AIResponse,
  fallbackUsed = false
) {
  const inputTokens = response.usage?.input_tokens;
  const outputTokens = response.usage?.output_tokens;
  logger.info(
    {
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens:
        typeof inputTokens === 'number' && typeof outputTokens === 'number'
          ? inputTokens + outputTokens
          : undefined,
      latencyMs: Date.now() - startedAt,
      fallbackUsed,
    },
    'AI generation completed'
  );
}

function logFailure(
  provider: AIProvider,
  model: string | undefined,
  startedAt: number,
  error: unknown,
  fallbackUsed = false
) {
  logger.error(
    {
      provider,
      model,
      errorCategory: isAIProviderError(error) ? error.category : 'unknown',
      statusCode: isAIProviderError(error) ? error.statusCode : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - startedAt,
      fallbackUsed,
    },
    'AI generation failed'
  );
}
