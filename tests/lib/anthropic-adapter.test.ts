import assert from 'node:assert/strict';
import { test } from 'node:test';
import Anthropic from '@anthropic-ai/sdk';
import { createAnthropicAdapter } from '../../src/lib/ai/provider/anthropicAdapter';
import type { AIMessageContent } from '../../src/lib/ai/providerTypes';

test('anthropic adapter maps response usage and text content with parity', async () => {
  const capturedCalls: unknown[] = [];
  const adapter = createAnthropicAdapter({
    client: {
      messages: {
        create: async (params: unknown) => {
          capturedCalls.push(params);
          return {
            content: [
              { type: 'text', text: 'Hei ' },
              { type: 'tool_use', id: 'tool_1', name: 'noop', input: {} },
              { type: 'text', text: 'maailma' },
            ],
            usage: { input_tokens: 123, output_tokens: 456 },
          } as any;
        },
      },
    } as any,
    logger: {
      info: () => undefined,
      error: () => undefined,
    } as any,
  });

  const messages: AIMessageContent[] = [{ type: 'text', text: 'test' }];
  const response = await adapter(messages, { model: 'claude-haiku-4-5-20251001', maxTokens: 321 });

  assert.deepEqual(response, {
    content: 'Hei maailma',
    usage: {
      input_tokens: 123,
      output_tokens: 456,
    },
  });

  assert.equal(capturedCalls.length, 1);
  assert.deepEqual(capturedCalls[0], {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 321,
    messages: [
      {
        role: 'user',
        content: messages,
      },
    ],
  });
});

test('anthropic adapter preserves user-safe API error mapping', async () => {
  const adapter = createAnthropicAdapter({
    client: {
      messages: {
        create: async () => {
          throw Anthropic.APIError.generate(429, { message: 'too many requests' }, undefined, undefined);
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
