import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import {
  identifyTopicsFromMaterial,
  processUploadedFiles,
} from '@/lib/api/questionGeneration';

// Configure route segment for Vercel deployment
export const maxDuration = 60; // 1 minute for topic analysis

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/identify-topics' });

  logger.info({ method: 'POST' }, 'Topic identification request received');

  try {
    // Verify authentication
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to identify topics.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Extract basic fields
    const subject = formData.get('subject') as string;
    const gradeStr = formData.get('grade') as string | null;
    const grade = gradeStr ? parseInt(gradeStr) : undefined;
    const materialText = (formData.get('materialText') as string | null) || undefined;

    // Validate required fields
    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    // Process uploaded files
    const { files, error: fileError } = await processUploadedFiles(formData);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return NextResponse.json(
        { error: 'Please provide material (text or files) for topic identification' },
        { status: 400 }
      );
    }

    logger.info(
      {
        subject,
        grade,
        hasText: !!materialText,
        fileCount: files.length,
      },
      'Starting topic identification'
    );

    // Identify topics
    const topics = await identifyTopicsFromMaterial({
      subject,
      grade,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
    });

    logger.info(
      {
        topicCount: topics.length,
        topics,
      },
      'Topic identification completed successfully'
    );

    return NextResponse.json({
      success: true,
      topics,
      count: topics.length,
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
      { status: 500 }
    );
  }
}
