import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '@/lib/logger';
import { getServerEnv } from '@/lib/env';

const logger = createLogger({ module: 'anthropic' });

const anthropic = new Anthropic({
  apiKey: getServerEnv().ANTHROPIC_API_KEY,
  timeout: 290000, // ~4.8 minutes to align with 5 minute route maxDuration
  maxRetries: 2, // Retry failed requests twice
});

export interface MessageContent {
  type: 'text' | 'image' | 'document';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface AnthropicResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Generate content using Claude
 */
export async function generateWithClaude(
  messages: MessageContent[],
  maxTokens = 16000
): Promise<AnthropicResponse> {
  try {
    logger.info(
      {
        messageCount: messages.length,
        maxTokens,
        model: 'claude-sonnet-4-20250514',
      },
      'Calling Anthropic API'
    );

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
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
    // Extract error details for better debugging
    let errorMessage = 'Unknown error';
    let errorType = 'unknown';
    let statusCode: number | undefined;

    if (error instanceof Anthropic.APIError) {
      errorMessage = error.message;
      errorType = 'api_error';
      statusCode = error.status;

      // Log detailed error information
      logger.error(
        {
          errorType,
          errorMessage,
          statusCode,
          errorName: error.name,
        },
        'Anthropic API error'
      );

      // Categorize common errors for better user feedback
      if (error.status === 401) {
        throw new Error('Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error.status === 400) {
        throw new Error('Invalid request format. Please check your input and try again.');
      } else if (error.status === 413) {
        throw new Error('Request too large. Please reduce the size of your materials.');
      } else if (error.status === 500 || error.status === 502 || error.status === 503) {
        throw new Error('Anthropic API is temporarily unavailable. Please try again later.');
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      logger.error(
        {
          errorMessage,
          errorName: error.name,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
        },
        'Error calling Anthropic API'
      );
    } else {
      logger.error(
        {
          error: String(error),
        },
        'Unknown error calling Anthropic API'
      );
    }

    // Throw with original error message if not categorized
    throw new Error(`Failed to generate content with AI: ${errorMessage}`);
  }
}
