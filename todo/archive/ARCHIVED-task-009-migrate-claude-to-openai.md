# Task: Migrate from Claude Sonnet 4 to OpenAI GPT-4

## Context

- Why this is needed:
  - User decision: Replace Claude with OpenAI as primary AI provider
  - Leverage OpenAI's workflow capabilities
  - Model management on OpenAI side

- Related docs/links:
  - `/Documentation/QUESTION-GENERATION-FLOW.md` - Current architecture with Claude
  - OpenAI API Documentation: https://platform.openai.com/docs/api-reference
  - OpenAI Models: https://platform.openai.com/docs/models

- Related files:
  - `/src/lib/ai/anthropic.ts` → Refactor to `/src/lib/ai/openai.ts`
  - `/src/lib/ai/questionGenerator.ts` - Update AI calls
  - `/src/lib/ai/topicIdentifier.ts` - Update AI calls
  - `/.env.example` - Replace environment variables
  - `/package.json` - Replace npm dependencies

## Scope

- In scope:
  - Replace Anthropic SDK with OpenAI SDK
  - Update environment variables (ANTHROPIC_API_KEY → OPENAI_API_KEY)
  - Choose OpenAI model (GPT-4 Turbo, GPT-4o, or o1)
  - Refactor API wrapper for OpenAI format
  - Update multimodal handling (PDF/image support)
  - Update token limits and pricing calculations
  - Test question generation quality with OpenAI
  - Update logging and error handling
  - Update documentation

- Out of scope:
  - Keeping Claude as fallback (single provider only)
  - OpenAI Assistants API (use Chat Completions API)
  - OpenAI fine-tuning (use base models)

## Changes

- [ ] Update dependencies in `package.json`:
  - Remove: `@anthropic-ai/sdk`
  - Add: `openai` (latest version)
  - Run: `npm install openai && npm uninstall @anthropic-ai/sdk`

- [ ] Update environment variables:
  - `.env.example`: Replace ANTHROPIC_API_KEY with OPENAI_API_KEY
  - `.env.local`: Add OPENAI_API_KEY (user must obtain from OpenAI)
  - Remove all ANTHROPIC_* variables

- [ ] Choose OpenAI model:
  - **Option A: GPT-4 Turbo** (`gpt-4-turbo-preview` or `gpt-4-0125-preview`)
    - Pros: Cost-effective, 128k context, good quality
    - Cons: Not the absolute latest
  - **Option B: GPT-4o** (`gpt-4o` or `gpt-4o-2024-11-20`)
    - Pros: Faster, cheaper than GPT-4 Turbo, multimodal native
    - Cons: Slightly lower quality than o1 for reasoning
  - **Option C: o1 models** (`o1-preview` or `o1-mini`)
    - Pros: Best reasoning quality, good for complex prompts
    - Cons: More expensive, no streaming, slower
  - **Recommended**: Start with GPT-4o (balance of speed, cost, quality)

- [ ] Refactor `/src/lib/ai/anthropic.ts` → `/src/lib/ai/openai.ts`:
  - Rename file
  - Replace Anthropic SDK with OpenAI SDK
  - Update function signature (different message format)
  - Handle OpenAI response format
  - Update error handling (OpenAI has different error types)

- [ ] Update `/src/lib/ai/questionGenerator.ts`:
  - Import `generateWithOpenAI` instead of `generateWithClaude`
  - Update message format (OpenAI uses different structure)
  - Keep same validation and parsing logic

- [ ] Update `/src/lib/ai/topicIdentifier.ts`:
  - Import `generateWithOpenAI` instead of `generateWithClaude`
  - Update message format
  - Keep same validation logic

- [ ] Update multimodal handling:
  - OpenAI supports images natively via `image_url` type
  - OpenAI DOES support PDFs natively via `image_url` type (same as images!)
  - Convert PDFs to base64 data URLs: `data:application/pdf;base64,...`
  - No text extraction or preprocessing needed

- [ ] Update token limits:
  - GPT-4 Turbo: 128k context, 4k output
  - GPT-4o: 128k context, 16k output
  - o1 models: 128k context, 32k output
  - Adjust max_tokens in API calls

- [ ] Update logging:
  - Replace "Anthropic API" messages with "OpenAI API"
  - Log model name (gpt-4o, gpt-4-turbo, etc.)
  - Update error messages

- [ ] Update documentation:
  - `/Documentation/QUESTION-GENERATION-FLOW.md`
  - `/CLAUDE.md` or `/AGENTS.md` (model references)
  - `/README.md` (environment variables section)
  - `/DWF/adr/ADR-001-core-architecture.md` (decision record)

## Acceptance Criteria

- [ ] OpenAI SDK installed (`openai` npm package)
- [ ] Anthropic SDK removed (`@anthropic-ai/sdk` uninstalled)
- [ ] `OPENAI_API_KEY` environment variable configured
- [ ] No references to ANTHROPIC_API_KEY in codebase
- [ ] `src/lib/ai/openai.ts` created with OpenAI integration
- [ ] `src/lib/ai/anthropic.ts` deleted
- [ ] Question generation works with OpenAI (quiz mode)
- [ ] Question generation works with OpenAI (flashcard mode)
- [ ] Topic identification works with OpenAI
- [ ] PDF handling works (native PDF support via base64)
- [ ] Image handling works (multimodal)
- [ ] Error handling works (rate limits, API errors)
- [ ] Logging shows OpenAI model and token usage
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] All tests pass (if any)
- [ ] Documentation updated with OpenAI model details

## Testing

- [ ] Tests to run:
  - Manual: Generate questions with text material (OpenAI API)
  - Manual: Generate questions with PDF (test native PDF support)
  - Manual: Generate questions with images (multimodal)
  - Manual: Generate flashcards (test flashcard prompts)
  - Manual: Test error handling (invalid API key, rate limit)
  - Manual: Check token usage logging
  - `npm run typecheck`
  - `npm run build`

- [ ] New/updated tests:
  - Unit test: OpenAI API wrapper (mock responses)
  - Unit test: PDF/image data URL formatting
  - Integration test: Full question generation flow

## Implementation Notes

### Model Selection Decision Matrix

| Model | Cost (1M tokens) | Speed | Quality | Context | Output | Recommended Use |
|-------|------------------|-------|---------|---------|--------|-----------------|
| GPT-4o | $2.50 in / $10 out | Fast | Very Good | 128k | 16k | **General (Recommended)** |
| GPT-4 Turbo | $10 in / $30 out | Medium | Excellent | 128k | 4k | High-quality questions |
| o1-preview | $15 in / $60 out | Slow | Best | 128k | 32k | Complex reasoning |
| o1-mini | $3 in / $12 out | Medium | Good | 128k | 32k | Cost-effective reasoning |

**Recommendation**: Start with **GPT-4o** (`gpt-4o-2024-11-20`)
- Best balance of speed, cost, and quality
- Native multimodal support (images + text)
- 16k output tokens (enough for 100-400 questions)

### OpenAI API Wrapper (`src/lib/ai/openai.ts`)

```typescript
import OpenAI from 'openai';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'openai' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 120000, // 2 minutes
  maxRetries: 2,
});

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string; // data:image/jpeg;base64,... or https://...
  };
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function generateWithOpenAI(
  messages: MessageContent[],
  maxTokens = 16000
): Promise<OpenAIResponse> {
  try {
    logger.info(
      {
        messageCount: messages.length,
        maxTokens,
        model: 'gpt-4o-2024-11-20',
      },
      'Calling OpenAI API'
    );

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-2024-11-20',
      messages: [
        {
          role: 'user',
          content: messages.map(msg => {
            if (msg.type === 'text') {
              return { type: 'text', text: msg.text || '' };
            } else {
              return { type: 'image_url', image_url: msg.image_url };
            }
          }),
        },
      ],
      max_tokens: maxTokens,
      temperature: 1.0, // Default creativity
      response_format: { type: 'json_object' }, // Force JSON responses
    });

    logger.info(
      {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens,
      },
      'OpenAI API call successful'
    );

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      usage: response.usage
        ? {
            prompt_tokens: response.usage.prompt_tokens,
            completion_tokens: response.usage.completion_tokens,
            total_tokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    // OpenAI error handling
    if (error instanceof OpenAI.APIError) {
      logger.error(
        {
          status: error.status,
          message: error.message,
          type: error.type,
        },
        'OpenAI API error'
      );

      // Categorize errors
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key. Check OPENAI_API_KEY environment variable.');
      } else if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Try again in a moment.');
      } else if (error.status === 400) {
        throw new Error('Invalid request to OpenAI. Check input format.');
      } else if (error.status === 500 || error.status === 502 || error.status === 503) {
        throw new Error('OpenAI API temporarily unavailable. Try again later.');
      }
    }

    logger.error({ error: String(error) }, 'Failed to generate content with OpenAI');
    throw new Error(`OpenAI API call failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

### PDF Handling (Native Support!)

OpenAI DOES support PDFs natively via vision models - no text extraction needed!

```typescript
// In /src/app/api/generate-questions/route.ts
// NO CHANGES TO PDF EXTRACTION LOGIC - just update the message format

// When processing uploaded PDFs
for (const [, value] of fileEntries) {
  if (value instanceof File) {
    const arrayBuffer = await value.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detectedType = await fileTypeFromBuffer(buffer);

    if (detectedType?.mime === 'application/pdf') {
      // PDFs: Convert to data URL for OpenAI (same as images!)
      const base64 = buffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64}`;

      files.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });

      logger.info(
        {
          fileName: value.name,
          size: buffer.length,
        },
        'Added PDF to file list'
      );
    } else if (detectedType?.mime.startsWith('image/')) {
      // Images: Convert to data URL for OpenAI
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${detectedType.mime};base64,${base64}`;

      files.push({
        type: 'image_url',
        image_url: { url: dataUrl },
      });
    }
  }
}
```

**Key Point**: OpenAI vision models treat PDFs like images - send as base64 data URLs!

### Environment Variables Update

**Old (.env.example)**:
```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**New (.env.example)**:
```bash
# OpenAI API (GPT-4o, GPT-4 Turbo, o1 models)
OPENAI_API_KEY=your_openai_api_key

# Optional: Override default model
# OPENAI_MODEL=gpt-4o-2024-11-20  # Default
# OPENAI_MODEL=gpt-4-turbo-preview  # Alternative
# OPENAI_MODEL=o1-preview  # Reasoning-focused
```

### Cost Comparison

**Current (Claude Sonnet 4)**:
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Typical question generation: ~10k input, ~20k output = $0.33 per request

**OpenAI GPT-4o** (Recommended):
- Input: $2.50 per 1M tokens
- Output: $10 per 1M tokens
- Typical question generation: ~10k input, ~20k output = $0.23 per request
- **Savings: ~30% cheaper**

**OpenAI GPT-4 Turbo**:
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens
- Typical: ~10k input, ~20k output = $0.70 per request
- **Cost: 2x more expensive than Claude**

### Migration Checklist

- [ ] Sign up for OpenAI account: https://platform.openai.com
- [ ] Generate API key: https://platform.openai.com/api-keys
- [ ] Add billing method (OpenAI requires prepaid credits)
- [ ] Set usage limits (recommended: $50/month for testing)
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Implement `src/lib/ai/openai.ts`
- [ ] Refactor `questionGenerator.ts` and `topicIdentifier.ts`
- [ ] Update PDF/image handling to use data URL format
- [ ] Test with sample materials (PDFs, images, text)
- [ ] Monitor token usage and costs
- [ ] Update all documentation

### Breaking Changes

**PDF Support**:
- **Before**: Claude natively reads PDFs via `type: 'document'`
- **After**: OpenAI natively reads PDFs via `type: 'image_url'` (treats PDFs like images)
- **No degradation**: Both providers support native PDF viewing!

**API Response Format**:
- **Before**: Anthropic returns `response.content[].text`
- **After**: OpenAI returns `response.choices[0].message.content`

**Image Format**:
- **Before**: Anthropic uses base64 with source.data
- **After**: OpenAI uses data URLs (`data:image/jpeg;base64,...`)

**Token Limits**:
- **Before**: Claude Sonnet 4 has 200k context
- **After**: GPT-4o has 128k context (still sufficient)

### Rollback Plan

If OpenAI migration causes issues:

1. Keep `anthropic.ts` in git history
2. Reinstall Anthropic SDK: `npm install @anthropic-ai/sdk`
3. Restore ANTHROPIC_API_KEY environment variable
4. Revert imports in questionGenerator.ts and topicIdentifier.ts
5. Remove OpenAI SDK: `npm uninstall openai`
6. Deploy previous version

**Recommendation**: Test thoroughly in development before deploying to production.
