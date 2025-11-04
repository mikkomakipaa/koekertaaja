import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
    console.error('Error calling Anthropic API:', error);
    throw new Error('Failed to generate content with AI');
  }
}
