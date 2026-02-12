export type AIProvider = 'anthropic' | 'openai';
export type AIErrorCategory =
  | 'auth'
  | 'rate_limit'
  | 'invalid_request'
  | 'request_too_large'
  | 'provider_unavailable'
  | 'network'
  | 'timeout'
  | 'unknown';

export interface AIMessageContent {
  type: 'text' | 'image' | 'document';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface AIResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface AIModelSelection {
  provider: AIProvider;
  model: string;
}

export interface AIProviderErrorOptions {
  provider: AIProvider;
  model: string;
  category: AIErrorCategory;
  message: string;
  statusCode?: number;
  cause?: unknown;
}

export class AIProviderError extends Error {
  readonly provider: AIProvider;
  readonly model: string;
  readonly category: AIErrorCategory;
  readonly statusCode?: number;

  constructor(options: AIProviderErrorOptions) {
    super(options.message);
    this.name = 'AIProviderError';
    this.provider = options.provider;
    this.model = options.model;
    this.category = options.category;
    this.statusCode = options.statusCode;
    if (options.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = options.cause;
    }
  }
}

export function isAIProviderError(error: unknown): error is AIProviderError {
  return error instanceof AIProviderError;
}

export function isTransientAIErrorCategory(category: AIErrorCategory): boolean {
  return category === 'rate_limit' || category === 'provider_unavailable' || category === 'network' || category === 'timeout';
}

export function isTransientAIError(error: unknown): boolean {
  return isAIProviderError(error) && isTransientAIErrorCategory(error.category);
}
