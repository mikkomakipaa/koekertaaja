/**
 * API Route: Delete Question Set
 *
 * Deletes a question set and all its questions (CASCADE)
 * Server-side only to use admin client
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteQuestionSet } from '@/lib/supabase/write-queries';
import { requireAuth } from '@/lib/supabase/server-auth';
import { createLogger } from '@/lib/logger';
import crypto from 'crypto';

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/delete-question-set' });

  try {
    // Verify authentication
    let user;
    try {
      user = await requireAuth();
      logger.info({ userId: user.id }, 'User authenticated');
    } catch (authError) {
      logger.warn({ error: authError instanceof Error ? authError.message : authError }, 'Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to delete question sets.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { questionSetId } = body;

    // Validate input
    if (!questionSetId) {
      logger.warn('Missing question set ID in request');
      return NextResponse.json(
        { error: 'Question set ID is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logger.error('SUPABASE_SERVICE_ROLE_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    logger.info({ questionSetId }, 'Attempting to delete question set');

    // Delete the question set
    const success = await deleteQuestionSet(questionSetId);

    if (!success) {
      logger.error({ questionSetId }, 'Failed to delete question set');
      return NextResponse.json(
        { error: 'Failed to delete question set. Check server logs for details.' },
        { status: 500 }
      );
    }

    logger.info({ questionSetId }, 'Successfully deleted question set');
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : error, stack: error instanceof Error ? error.stack : undefined },
      'Error in delete-question-set API'
    );
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
