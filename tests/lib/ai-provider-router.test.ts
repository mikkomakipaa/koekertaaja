import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateWithAI } from '../../src/lib/ai/providerRouter';
import { AIProviderError, type AIMessageContent } from '../../src/lib/ai/providerTypes';

test('generateWithAI routes to Anthropic by default', async () => {
  const messages: AIMessageContent[] = [{ type: 'text', text: 'Hei maailma' }];
  let called = 0;

  const response = await generateWithAI(messages, {}, {
    anthropic: async (inputMessages, options) => {
      called += 1;
      assert.deepEqual(inputMessages, messages);
      assert.equal(options.provider, undefined);
      return { content: 'ok', usage: { input_tokens: 1, output_tokens: 2 } };
    },
    openai: async () => {
      throw new Error('OpenAI adapter should not be called for default provider');
    },
  });

  assert.equal(called, 1);
  assert.equal(response.content, 'ok');
  assert.deepEqual(response.usage, { input_tokens: 1, output_tokens: 2 });
});

test('generateWithAI routes to OpenAI when requested', async () => {
  const messages: AIMessageContent[] = [{ type: 'text', text: 'Hei OpenAI' }];
  let called = 0;

  const response = await generateWithAI(messages, { provider: 'openai' }, {
    anthropic: async () => {
      throw new Error('Anthropic adapter should not be called for OpenAI provider');
    },
    openai: async (inputMessages, options) => {
      called += 1;
      assert.deepEqual(inputMessages, messages);
      assert.equal(options.provider, 'openai');
      return { content: 'ok-openai', usage: { input_tokens: 3, output_tokens: 4 } };
    },
  });

  assert.equal(called, 1);
  assert.equal(response.content, 'ok-openai');
  assert.deepEqual(response.usage, { input_tokens: 3, output_tokens: 4 });
});

test('generateWithAI falls back to OpenAI on transient Anthropic failure when enabled', async () => {
  const previousFlag = process.env.AI_ENABLE_OPENAI;
  process.env.AI_ENABLE_OPENAI = 'true';

  const messages: AIMessageContent[] = [{ type: 'text', text: 'Hei fallback' }];
  let anthropicCalls = 0;
  let openAICalls = 0;

  try {
    const response = await generateWithAI(messages, { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }, {
      anthropic: async () => {
        anthropicCalls += 1;
        throw new AIProviderError({
          provider: 'anthropic',
          model: 'claude-sonnet-4-5-20250929',
          category: 'provider_unavailable',
          message: 'Anthropic API is temporarily unavailable. Please try again later.',
          statusCode: 503,
        });
      },
      openai: async (inputMessages, options) => {
        openAICalls += 1;
        assert.deepEqual(inputMessages, messages);
        assert.equal(options.provider, 'openai');
        assert.equal(options.model, 'gpt-4.1');
        return { content: 'fallback-ok', usage: { input_tokens: 5, output_tokens: 6 } };
      },
    });

    assert.equal(anthropicCalls, 1);
    assert.equal(openAICalls, 1);
    assert.equal(response.content, 'fallback-ok');
    assert.deepEqual(response.usage, { input_tokens: 5, output_tokens: 6 });
  } finally {
    process.env.AI_ENABLE_OPENAI = previousFlag;
  }
});

test('generateWithAI does not fall back when transient failure occurs but OpenAI fallback is disabled', async () => {
  const previousFlag = process.env.AI_ENABLE_OPENAI;
  process.env.AI_ENABLE_OPENAI = 'false';

  const messages: AIMessageContent[] = [{ type: 'text', text: 'Hei no fallback' }];
  let openAICalls = 0;

  try {
    await assert.rejects(
      () =>
        generateWithAI(messages, { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }, {
          anthropic: async () => {
            throw new AIProviderError({
              provider: 'anthropic',
              model: 'claude-sonnet-4-5-20250929',
              category: 'provider_unavailable',
              message: 'Anthropic API is temporarily unavailable. Please try again later.',
              statusCode: 503,
            });
          },
          openai: async () => {
            openAICalls += 1;
            return { content: 'unexpected' };
          },
        }),
      /Anthropic API is temporarily unavailable/
    );

    assert.equal(openAICalls, 0);
  } finally {
    process.env.AI_ENABLE_OPENAI = previousFlag;
  }
});

test('generateWithAI does not fall back on non-transient Anthropic failure', async () => {
  const previousFlag = process.env.AI_ENABLE_OPENAI;
  process.env.AI_ENABLE_OPENAI = 'true';

  const messages: AIMessageContent[] = [{ type: 'text', text: 'Hei auth error' }];
  let openAICalls = 0;

  try {
    await assert.rejects(
      () =>
        generateWithAI(messages, { provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' }, {
          anthropic: async () => {
            throw new AIProviderError({
              provider: 'anthropic',
              model: 'claude-sonnet-4-5-20250929',
              category: 'auth',
              message: 'Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.',
              statusCode: 401,
            });
          },
          openai: async () => {
            openAICalls += 1;
            return { content: 'unexpected' };
          },
        }),
      /Invalid API key/
    );

    assert.equal(openAICalls, 0);
  } finally {
    process.env.AI_ENABLE_OPENAI = previousFlag;
  }
});
