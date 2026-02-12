import { createLogger } from '@/lib/logger';
import { AIProviderError, type AIErrorCategory, type AIMessageContent, type AIResponse } from '../providerTypes';

export interface OpenAIAdapterOptions {
  model?: string;
  maxTokens?: number;
}

interface OpenAIResponsesCreateParams {
  model: string;
  input: Array<{
    role: 'user';
    content: OpenAIInputContent[];
  }>;
  max_output_tokens?: number;
  reasoning?: {
    effort?: 'minimal' | 'low' | 'medium' | 'high';
  };
  text?: {
    verbosity?: 'low' | 'medium' | 'high';
  };
}

interface OpenAIResponsesCreateResponse {
  status?: string;
  incomplete_details?: {
    reason?: string;
  };
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

type OpenAIInputContent =
  | {
      type: 'input_text';
      text: string;
    }
  | {
      type: 'input_image';
      image_url: string;
    }
  | {
      type: 'input_file';
      filename: string;
      file_data: string;
    };

interface OpenAIResponseErrorPayload {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

type OpenAIResponsesClient = {
  responses: {
    create: (params: OpenAIResponsesCreateParams) => Promise<OpenAIResponsesCreateResponse>;
  };
};

interface OpenAIAdapterDependencies {
  client?: OpenAIResponsesClient;
  logger?: ReturnType<typeof createLogger>;
}

const defaultLogger = createLogger({ module: 'openai' });
const PROVIDER = 'openai' as const;

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

class OpenAIAPIError extends Error {
  status?: number;
  type?: string;
  code?: string;

  constructor(message: string, options: { status?: number; type?: string; code?: string } = {}) {
    super(message);
    this.name = 'OpenAIAPIError';
    this.status = options.status;
    this.type = options.type;
    this.code = options.code;
  }
}

let defaultClient: OpenAIResponsesClient | undefined;

function buildDataUrl(mediaType: string, data: string): string {
  return `data:${mediaType};base64,${data}`;
}

function getDocumentFilename(mediaType: string): string {
  if (mediaType === 'application/pdf') {
    return 'document.pdf';
  }

  return 'document.bin';
}

function mapMessagesToInput(messages: AIMessageContent[]): OpenAIInputContent[] {
  const inputContent: OpenAIInputContent[] = [];

  for (const message of messages) {
    if (message.type === 'text' && typeof message.text === 'string') {
      inputContent.push({
        type: 'input_text',
        text: message.text,
      });
      continue;
    }

    if (!message.source) {
      continue;
    }

    const dataUrl = buildDataUrl(message.source.media_type, message.source.data);

    if (message.type === 'image') {
      inputContent.push({
        type: 'input_image',
        image_url: dataUrl,
      });
      continue;
    }

    if (message.type === 'document') {
      inputContent.push({
        type: 'input_file',
        filename: getDocumentFilename(message.source.media_type),
        file_data: dataUrl,
      });
    }
  }

  return inputContent;
}

function extractText(response: OpenAIResponsesCreateResponse): string {
  if (typeof response.output_text === 'string' && response.output_text.length > 0) {
    return response.output_text;
  }

  if (!Array.isArray(response.output)) {
    return '';
  }

  const textParts: string[] = [];

  // Prefer text from assistant message blocks; ignore metadata/reasoning items.
  for (const item of response.output) {
    const itemType = typeof item?.type === 'string' ? item.type : '';
    if (itemType && itemType !== 'message' && itemType !== 'output_text') {
      continue;
    }

    const contentParts = Array.isArray(item?.content) ? item.content : [];
    for (const part of contentParts) {
      const partType = typeof part?.type === 'string' ? part.type : '';
      if (partType && !partType.includes('text')) {
        continue;
      }

      if (typeof part?.text === 'string' && part.text.trim()) {
        textParts.push(part.text.trim());
        continue;
      }

      const nestedText = (part as unknown as { text?: { value?: unknown } }).text;
      if (nestedText && typeof nestedText.value === 'string' && nestedText.value.trim()) {
        textParts.push(nestedText.value.trim());
      }
    }
  }

  return textParts.join('\n');
}

function getModelTuning(model: string): Pick<OpenAIResponsesCreateParams, 'reasoning' | 'text'> {
  if (model.startsWith('gpt-5')) {
    return {
      reasoning: { effort: 'minimal' },
      text: { verbosity: 'low' },
    };
  }

  return {};
}

function getOpenAIAPIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('Invalid API key. Please check your OPENAI_API_KEY environment variable.');
  }

  return key;
}

async function parseOpenAIErrorPayload(response: Response): Promise<OpenAIResponseErrorPayload> {
  try {
    return (await response.json()) as OpenAIResponseErrorPayload;
  } catch {
    return {};
  }
}

function getDefaultClient(): OpenAIResponsesClient {
  if (defaultClient) {
    return defaultClient;
  }

  defaultClient = {
    responses: {
      create: async (params: OpenAIResponsesCreateParams) => {
        const response = await fetch(OPENAI_RESPONSES_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getOpenAIAPIKey()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const payload = await parseOpenAIErrorPayload(response);
          throw new OpenAIAPIError(payload.error?.message ?? 'OpenAI request failed', {
            status: response.status,
            type: payload.error?.type,
            code: payload.error?.code,
          });
        }

        return (await response.json()) as OpenAIResponsesCreateResponse;
      },
    },
  };

  return defaultClient;
}

function categorizeOpenAIError(error: unknown): AIErrorCategory {
  const status = typeof error === 'object' && error !== null && 'status' in error ? (error.status as number) : undefined;
  if (status === 401) return 'auth';
  if (status === 429) return 'rate_limit';
  if (status === 400) return 'invalid_request';
  if (status === 413) return 'request_too_large';
  if (status === 500 || status === 502 || status === 503 || status === 504) return 'provider_unavailable';

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
    return 'Invalid API key. Please check your OPENAI_API_KEY environment variable.';
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
    return 'OpenAI API is temporarily unavailable. Please try again later.';
  }

  return `Failed to generate content with AI: ${fallback}`;
}

export function createOpenAIAdapter(dependencies: OpenAIAdapterDependencies = {}) {
  const logger = dependencies.logger ?? defaultLogger;

  return async function generateWithOpenAIAdapter(
    messages: AIMessageContent[],
    options: OpenAIAdapterOptions = {}
  ): Promise<AIResponse> {
    const client = dependencies.client ?? getDefaultClient();
    const model = options.model ?? 'gpt-5-mini';
    const maxOutputTokens = options.maxTokens ?? 16000;
    const inputContent = mapMessagesToInput(messages);
    const startedAt = Date.now();
    const modelTuning = getModelTuning(model);

    try {
      logger.info(
        {
          provider: PROVIDER,
          messageCount: messages.length,
          mappedPartCount: inputContent.length,
          maxOutputTokens,
          model,
        },
        'Calling OpenAI Responses API'
      );

      const response = await client.responses.create({
        model,
        max_output_tokens: maxOutputTokens,
        ...modelTuning,
        input: [
          {
            role: 'user',
            content: inputContent,
          },
        ],
      });

      const content = extractText(response);
      const usage =
        typeof response.usage?.input_tokens === 'number' && typeof response.usage?.output_tokens === 'number'
          ? {
              input_tokens: response.usage.input_tokens,
              output_tokens: response.usage.output_tokens,
            }
          : undefined;

      logger.info(
        {
          provider: PROVIDER,
          model,
          inputTokens: usage?.input_tokens,
          outputTokens: usage?.output_tokens,
          totalTokens:
            typeof usage?.input_tokens === 'number' && typeof usage?.output_tokens === 'number'
              ? usage.input_tokens + usage.output_tokens
              : undefined,
          latencyMs: Date.now() - startedAt,
          extractedContentLength: content.length,
          status: response.status,
          incompleteReason: response.incomplete_details?.reason,
        },
        'OpenAI Responses API call successful'
      );

      if (!content) {
        logger.warn(
          {
            provider: PROVIDER,
            model,
            status: response.status,
            incompleteReason: response.incomplete_details?.reason,
            responseKeys: Object.keys(response),
            outputItemCount: Array.isArray(response.output) ? response.output.length : 0,
            outputFirstItemType:
              Array.isArray(response.output) && response.output[0] && typeof response.output[0].type === 'string'
                ? response.output[0].type
                : undefined,
          },
          'OpenAI response did not contain extractable text content'
        );

        const incompleteDueToLimit =
          response.status === 'incomplete' && response.incomplete_details?.reason === 'max_output_tokens';

        throw new AIProviderError({
          provider: PROVIDER,
          model,
          category: incompleteDueToLimit ? 'timeout' : 'unknown',
          message: incompleteDueToLimit
            ? 'OpenAI response was incomplete due to output token limit. Please retry.'
            : 'OpenAI returned no assistant text content.',
        });
      }

      return {
        content,
        usage,
      };
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : String(error);
      const status = typeof error === 'object' && error !== null && 'status' in error ? (error.status as number) : undefined;
      const category = categorizeOpenAIError(error);
      const userMessage = toUserSafeErrorMessage(category, fallbackMessage);

      logger.error(
        {
          provider: PROVIDER,
          model,
          errorCategory: category,
          status,
          errorName: error instanceof Error ? error.name : 'unknown',
          errorMessage: fallbackMessage,
          latencyMs: Date.now() - startedAt,
        },
        'OpenAI Responses API error'
      );

      throw new AIProviderError({
        provider: PROVIDER,
        model,
        category,
        statusCode: status,
        message: userMessage,
        cause: error,
      });
    }
  };
}

export const generateWithOpenAIAdapter = createOpenAIAdapter();
