import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const flagSchema = z.object({
  questionId: z.string().uuid({ message: 'Invalid questionId' }),
  questionSetId: z.string().uuid({ message: 'Invalid questionSetId' }),
  reason: z.enum(['wrong_answer', 'ambiguous', 'typo', 'other'], {
    errorMap: () => ({ message: 'Invalid reason' }),
  }),
  note: z.string().max(1000, 'Note must be 1000 characters or less').optional(),
  clientId: z.string().min(8, 'Invalid clientId').max(200, 'Invalid clientId'),
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    const body = await request.json();
    const validationResult = flagSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { questionId, questionSetId, reason, note, clientId } = validationResult.data;
    const admin = getSupabaseAdmin();

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await admin
      .from('question_flags')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('created_at', cutoff);

    if (countError) {
      logger.error({ error: countError }, 'Failed to check flag rate limit');
      return NextResponse.json(
        { error: 'Failed to validate flagging limit' },
        { status: 500 }
      );
    }

    if ((count ?? 0) >= 3) {
      logger.warn({ clientId, count }, 'Flagging rate limit exceeded');
      return NextResponse.json(
        { error: 'Flagging limit reached. Try again later.' },
        { status: 429 }
      );
    }

    const trimmedNote = note?.trim();

    const { data, error: insertError } = await admin
      .from('question_flags')
      .insert({
        question_id: questionId,
        question_set_id: questionSetId,
        reason,
        note: trimmedNote ? trimmedNote : null,
        client_id: clientId,
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error({ error: insertError }, 'Failed to insert question flag');
      return NextResponse.json(
        { error: 'Failed to submit flag' },
        { status: 500 }
      );
    }

    logger.info({ flagId: data?.id }, 'Flag submitted successfully');
    return NextResponse.json({ success: true, flagId: data?.id });
  } catch (error) {
    logger.error({ error }, 'Unhandled error in question flag endpoint');
    return NextResponse.json(
      { error: 'Failed to submit flag', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
