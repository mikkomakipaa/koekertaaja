import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOpenAIAdapter } from '../../src/lib/ai/provider/openaiAdapter';
import type { AIMessageContent } from '../../src/lib/ai/providerTypes';

test('openai adapter maps text/image/document payloads and normalizes response', async () => {
  const capturedCalls: unknown[] = [];
  const adapter = createOpenAIAdapter({
    client: {
      responses: {
        create: async (params: unknown) => {
          capturedCalls.push(params);
          return {
            output_text: 'Hei maailma',
            usage: { input_tokens: 11, output_tokens: 22 },
          };
        },
      },
    } as any,
    logger: {
      info: () => undefined,
      error: () => undefined,
    } as any,
  });

  const messages: AIMessageContent[] = [
    { type: 'text', text: 'Analysoi liite' },
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/png',
        data: 'IMAGE_DATA',
      },
    },
    {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: 'PDF_DATA',
      },
    },
  ];

  const response = await adapter(messages, { model: 'gpt-4.1-mini', maxTokens: 321 });

  assert.deepEqual(response, {
    content: 'Hei maailma',
    usage: {
      input_tokens: 11,
      output_tokens: 22,
    },
  });

  assert.equal(capturedCalls.length, 1);
  assert.deepEqual(capturedCalls[0], {
    model: 'gpt-4.1-mini',
    max_output_tokens: 321,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Analysoi liite' },
          { type: 'input_image', image_url: 'data:image/png;base64,IMAGE_DATA' },
          {
            type: 'input_file',
            filename: 'document.pdf',
            file_data: 'data:application/pdf;base64,PDF_DATA',
          },
        ],
      },
    ],
  });
});

test('openai adapter preserves shared error mapping categories', async () => {
  const adapter = createOpenAIAdapter({
    client: {
      responses: {
        create: async () => {
          const error = new Error('too many requests');
          (error as Error & { status: number }).status = 429;
          throw error;
        },
      },
    } as any,
    logger: {
      info: () => undefined,
      error: () => undefined,
    } as any,
  });

  await assert.rejects(
    () => adapter([{ type: 'text', text: 'test' }]),
    /Rate limit exceeded\. Please try again in a few moments\./
  );
});

