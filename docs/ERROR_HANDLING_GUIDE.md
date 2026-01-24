# AI Error Handling Guide

## Overview

This document explains the error handling and logging strategy for AI-powered question generation in the Exam Prepper application.

## Problem Statement

The original implementation had minimal error logging in production, making it impossible to diagnose issues when the Anthropic API failed. Errors would simply show as "Failed to generate content with AI" with no additional context.

## Solution

We've implemented comprehensive error handling and structured logging using Pino to provide detailed error information while maintaining security in production.

## Error Categories

### 1. Anthropic API Errors

These are errors returned by the Anthropic API, categorized by HTTP status code:

#### 401 - Invalid API Key
**Cause**: `ANTHROPIC_API_KEY` environment variable is missing or invalid

**User Message**: "Invalid API key. Please check your ANTHROPIC_API_KEY environment variable."

**Resolution**:
- Verify `ANTHROPIC_API_KEY` is set in environment variables
- Check that the API key is valid and not expired
- Ensure the key has the correct permissions

#### 429 - Rate Limit Exceeded
**Cause**: Too many requests in a short time period

**User Message**: "Rate limit exceeded. Please try again in a few moments."

**Resolution**:
- Wait before retrying (SDK automatically retries twice)
- Reduce concurrent question set creation
- Consider upgrading Anthropic plan for higher limits

#### 400 - Invalid Request Format
**Cause**: Request doesn't match Anthropic API schema

**User Message**: "Invalid request format. Please check your input and try again."

**Possible Causes**:
- Invalid base64 encoding of files
- Unsupported media type
- Invalid message structure
- Content too large for model context window

**Resolution**:
- Check file uploads are valid
- Verify materials aren't corrupted
- Reduce material size

#### 413 - Request Too Large
**Cause**: Request body exceeds Anthropic's limits

**User Message**: "Request too large. Please reduce the size of your materials."

**Resolution**:
- Reduce number of files
- Compress or resize images
- Reduce PDF page count
- Use text input instead of file uploads

#### 500/502/503 - Server Errors
**Cause**: Anthropic API is experiencing issues

**User Message**: "Anthropic API is temporarily unavailable. Please try again later."

**Resolution**:
- Check [Anthropic Status Page](https://status.anthropic.com/)
- Retry after a few minutes
- Check Anthropic's Twitter/announcements for incidents

### 2. JSON Parsing Errors

**Cause**: AI returned malformed JSON

**Logged Information**:
- Error message
- Content length
- Content preview (dev only)

**User Message**: "AI returned invalid JSON format. The response could not be parsed."

**Possible Causes**:
- Model hallucination
- Incomplete response (hit max_tokens limit)
- Unexpected formatting

**Resolution**:
- Check if `max_tokens` (16000) is sufficient
- Review prompts to ensure they request JSON format
- Retry the request

### 3. Validation Errors

**Cause**: AI returned JSON that doesn't match expected question schema

**Logged Information**:
- Validation errors with paths
- Question count
- First question sample (dev only)

**User Message**: "AI returned invalid question format. Please try again."

**Possible Causes**:
- AI didn't follow schema instructions
- Missing required fields
- Invalid question types
- Malformed options/answers

**Resolution**:
- Review prompt templates in `src/config/prompts/`
- Check Zod schema in `src/lib/validation/schemas.ts`
- Retry the request
- If persistent, update prompts to be more explicit

## Logging Strategy

### Production Logging

In production (`NODE_ENV=production`):
- ✅ Log all errors with structured data
- ✅ Include error types, status codes, and messages
- ✅ Include request IDs for tracing
- ❌ Exclude sensitive data (API keys, user content)
- ❌ Exclude stack traces
- ❌ Exclude full AI responses

### Development Logging

In development:
- ✅ All production logs
- ✅ Stack traces for all errors
- ✅ Content previews for debugging
- ✅ Full validation error details
- ✅ Sample question data

## Structured Logging

All logging uses Pino with structured data:

```typescript
logger.error(
  {
    errorType: 'api_error',
    errorMessage: 'Rate limit exceeded',
    statusCode: 429,
    requestId: 'abc-123',
  },
  'Anthropic API error'
);
```

### Log Levels

- `error`: API failures, parsing errors, validation errors
- `info`: Successful API calls, token usage, question generation progress
- `debug`: Detailed request/response data (dev only)

## Monitoring

### Key Metrics to Monitor

1. **Error Rate**: Track frequency of different error types
2. **API Latency**: Time taken for Anthropic API calls
3. **Token Usage**: Input/output tokens per request
4. **Success Rate**: Percentage of successful question generation

### Log Queries

Example queries for common issues:

#### Find all API errors in the last hour
```json
{
  "level": "error",
  "module": "anthropic",
  "time": { "$gte": "2025-01-01T00:00:00Z" }
}
```

#### Find rate limit errors
```json
{
  "level": "error",
  "statusCode": 429
}
```

#### Find validation failures
```json
{
  "level": "error",
  "msg": "AI response validation failed"
}
```

## Error Flow

```
User Request
    ↓
API Route (/api/generate-questions)
    ↓
generateQuestions()
    ↓
generateWithClaude()
    ↓
[Anthropic API Call]
    ↓
Success → Parse JSON → Validate → Return Questions
    ↓
Error → Log Details → Categorize → Throw User-Friendly Error
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
LOG_LEVEL=info  # or 'debug', 'warn', 'error'
NODE_ENV=production  # or 'development'
```

### Anthropic Client Configuration

```typescript
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120000,  // 2 minutes
  maxRetries: 2,    // Retry failed requests twice
});
```

## Troubleshooting Guide

### No Logs Appearing

1. Check `LOG_LEVEL` environment variable
2. Verify logger is imported: `import { createLogger } from '@/lib/logger'`
3. Check Vercel logs dashboard (for production)

### Logs Missing Error Details

1. Verify `NODE_ENV` is set correctly
2. Check that structured data is passed to logger
3. Ensure error object is properly parsed

### Too Many Logs

1. Increase `LOG_LEVEL` to 'warn' or 'error'
2. Filter logs by module in log aggregator
3. Set up log sampling for high-traffic endpoints

## Best Practices

1. **Always use structured logging**: Pass objects, not concatenated strings
2. **Include request IDs**: Makes tracing easier across services
3. **Sanitize sensitive data**: Never log API keys, user passwords, etc.
4. **Use appropriate log levels**: Don't log errors as info
5. **Add context**: Include relevant IDs, counts, and metadata
6. **Make errors actionable**: Include what went wrong and how to fix it

## Related Files

- `src/lib/logger.ts` - Pino logger configuration
- `src/lib/ai/anthropic.ts` - Anthropic API client with error handling
- `src/lib/ai/questionGenerator.ts` - Question generation with validation
- `src/app/api/generate-questions/route.ts` - API route error handling
- `src/lib/validation/schemas.ts` - Zod schemas for validation

## References

- [Pino Documentation](https://getpino.io/)
- [Anthropic API Errors](https://docs.anthropic.com/claude/reference/errors)
- [Anthropic Status Page](https://status.anthropic.com/)
