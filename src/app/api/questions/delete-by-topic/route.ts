/**
 * API Route: Delete Questions By Topic
 *
 * Deletes all questions with a specific topic from a question set.
 * Pass topic: null to delete questions with no topic.
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestionsByTopic } from '@/lib/supabase/write-queries';
import { requireAuth } from '@/lib/supabase/server-auth';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';
import { z } from 'zod';

const requestSchema = z.object({
  questionSetId: z.string().uuid(),
  topic: z.string().nullable(),
});

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/questions/delete-by-topic' });

  try {
    let user;
    try {
      user = await requireAuth();
      logger.info({ userId: user.id }, 'User authenticated');
    } catch (authError) {
      logger.warn({ error: authError instanceof Error ? authError.message : authError }, 'Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      logger.warn({ issues: parsed.error.issues }, 'Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request: questionSetId (UUID) and topic (string | null) are required' },
        { status: 400 }
      );
    }

    const { questionSetId, topic } = parsed.data;

    logger.info({ questionSetId, topic }, 'Deleting questions by topic');

    const result = await deleteQuestionsByTopic(questionSetId, topic);

    if (!result) {
      logger.error({ questionSetId, topic }, 'Failed to delete questions by topic');
      return NextResponse.json(
        { error: 'Failed to delete questions. Check server logs for details.' },
        { status: 500 }
      );
    }

    logger.info({ questionSetId, topic, ...result }, 'Successfully deleted questions by topic');
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined },
      'Error in delete-by-topic API'
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
