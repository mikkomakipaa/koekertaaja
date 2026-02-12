import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import {
  identifyTopicsFromMaterial,
  processUploadedFiles,
} from '@/lib/api/questionGeneration';
import { parseRequestedProvider, validateRequestedProvider } from '@/lib/api/modelSelection';
import { getSimpleTopics } from '@/lib/ai/topicIdentifier';
import {
  checkRateLimit,
  getClientIp,
  buildRateLimitKey,
  createRateLimitHeaders,
} from '@/lib/ratelimit';

// Configure route segment for Vercel deployment
export const maxDuration = 60; // 1 minute for topic analysis

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/identify-topics' });
  let baseHeaders: Headers | undefined;

  logger.info({ method: 'POST' }, 'Topic identification request received');

  try {
    const clientIp = getClientIp(request.headers);
    const clientId = request.headers.get('x-client-id') || request.headers.get('x-clientid') || undefined;
    let userId: string | undefined;

    // Verify authentication
    try {
      const user = await requireAuth();
      userId = user.id;
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
    }

    const rateLimitKey = buildRateLimitKey({
      ip: clientIp,
      userId,
      clientId,
      prefix: 'identify-topics',
    });
    const rateLimitResult = checkRateLimit(rateLimitKey, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });
    baseHeaders = createRateLimitHeaders(rateLimitResult);
    const respond = (body: unknown, status = 200, headers?: Headers) =>
      NextResponse.json(body, { status, headers: headers ?? baseHeaders });

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      const headers = createRateLimitHeaders(rateLimitResult, retryAfterSeconds);
      return respond(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfterSeconds,
        },
        429,
        headers
      );
    }

    if (!userId) {
      return respond(
        { error: 'Unauthorized. Please log in to identify topics.' },
        401
      );
    }

    const formData = await request.formData();

    // Extract basic fields
    const subject = formData.get('subject') as string;
    const gradeStr = formData.get('grade') as string | null;
    const grade = gradeStr ? parseInt(gradeStr) : undefined;
    const materialText = (formData.get('materialText') as string | null) || undefined;
    const targetProvider = parseRequestedProvider(formData.get('provider'));
    if (targetProvider) {
      const modelValidationError = validateRequestedProvider(targetProvider);
      if (modelValidationError) {
        return respond({ error: modelValidationError }, 400);
      }
    }

    // Validate required fields
    if (!subject) {
      return respond(
        { error: 'Subject is required' },
        400
      );
    }

    // Process uploaded files
    const { files, error: fileError } = await processUploadedFiles(formData);
    if (fileError) {
      return respond({ error: fileError }, 400);
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return respond(
        { error: 'Please provide material (text or files) for topic identification' },
        400
      );
    }

    logger.info(
      {
        subject,
        grade,
        hasText: !!materialText,
        fileCount: files.length,
        provider: targetProvider ?? 'anthropic',
      },
      'Starting topic identification'
    );

    // Identify topics (returns enhanced analysis)
    const topicAnalysis = await identifyTopicsFromMaterial({
      subject,
      grade,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      targetProvider,
    });

    // Extract simple topic names for backward compatibility
    const simpleTopics = getSimpleTopics(topicAnalysis);

    logger.info(
      {
        topicCount: topicAnalysis.topics.length,
        enhancedTopics: topicAnalysis.topics.map(t => ({
          name: t.name,
          coverage: t.coverage,
          difficulty: t.difficulty,
          importance: t.importance,
        })),
        metadata: topicAnalysis.metadata,
      },
      'Topic identification completed successfully'
    );

    return respond({
      success: true,
      topics: simpleTopics, // Backward compatibility
      count: simpleTopics.length,
      // NEW: Enhanced data for clients that want it
      enhanced: {
        topics: topicAnalysis.topics,
        primarySubject: topicAnalysis.primarySubject,
        metadata: topicAnalysis.metadata,
      },
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error server-side
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      },
      'Topic identification failed'
    );

    // Return sanitized error to client
    return NextResponse.json(
      {
        error: isProduction
          ? 'Failed to identify topics. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      { status: 500, headers: baseHeaders ?? new Headers() }
    );
  }
}
