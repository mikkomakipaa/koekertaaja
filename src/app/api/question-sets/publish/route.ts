import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createLogger } from '@/lib/logger';
import { z } from 'zod';
import type { QuestionSet, QuestionSetStatus } from '@/types/questions';

/**
 * PATCH /api/question-sets/publish
 *
 * Admin-only endpoint to publish or unpublish question sets.
 * Changes the status of a question set between 'created' (unpublished) and 'published'.
 */
export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-sets/publish' });

  logger.info({ method: 'PATCH' }, 'Request received');

  try {
    // Verify admin authentication
    try {
      await requireAdmin();
      logger.info('Admin authentication successful');
    } catch (authError) {
      const errorMessage = authError instanceof Error ? authError.message : 'Unauthorized';
      logger.warn({ error: errorMessage }, 'Authentication failed');

      const status = errorMessage.includes('Forbidden') ? 403 : 401;
      const message = status === 403
        ? 'Forbidden. Admin access required to publish question sets.'
        : 'Unauthorized. Please log in.';

      return NextResponse.json({ error: message }, { status });
    }

    const body = await request.json();

    // Validation schema
    const publishSchema = z.object({
      questionSetId: z.string().uuid('Invalid question set ID'),
      status: z.enum(['created', 'published'], {
        errorMap: () => ({ message: 'Status must be "created" or "published"' }),
      }),
    });

    // Validate request body
    const validationResult = publishSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { questionSetId, status } = validationResult.data;

    // Update question set status
    const supabaseAdmin = getSupabaseAdmin() as SupabaseClient<any>;
    type PublishedQuestionSet = Pick<QuestionSet, 'id' | 'code' | 'name' | 'status' | 'updated_at'>;

    const { data, error } = await supabaseAdmin
      .from('question_sets')
      .update({ status })
      .eq('id', questionSetId)
      .select('id, code, name, status, updated_at')
      .returns<PublishedQuestionSet>()
      .maybeSingle();

    if (error) {
      logger.error({ error: error.message }, 'Failed to update question set');

      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Question set not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update question set status' },
        { status: 500 }
      );
    }

    if (!data) {
      logger.warn({ questionSetId }, 'Question set not found');
      return NextResponse.json(
        { error: 'Question set not found' },
        { status: 404 }
      );
    }

    const questionSet = data as PublishedQuestionSet;

    logger.info(
      {
        questionSetId: questionSet.id,
        code: questionSet.code,
        newStatus: questionSet.status,
      },
      'Question set status updated successfully'
    );

    return NextResponse.json({
      success: true,
      questionSet: {
        id: questionSet.id,
        code: questionSet.code,
        name: questionSet.name,
        status: questionSet.status,
        updated_at: questionSet.updated_at,
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
      'Request failed'
    );

    // Return sanitized error to client
    return NextResponse.json(
      {
        error: isProduction
          ? 'Failed to update question set status. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
