import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/logger';
import { verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildServerRateLimitKey } from '@/lib/ratelimit';
import {
  flagSchema,
  PER_QUESTION_WINDOW_MS,
  getFlagAbuseRejection,
} from '@/lib/question-flags/abuse-controls';

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

    const { questionId, questionSetId, reason, note } = validationResult.data;
    const admin = getSupabaseAdmin();
    const user = await verifyAuth();
    const abuseIdentity = buildServerRateLimitKey(request.headers, {
      prefix: 'question-flags',
      userId: user?.id,
    });

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const questionWindowCutoff = new Date(Date.now() - PER_QUESTION_WINDOW_MS).toISOString();

    const { count: dailyCount, error: dailyCountError } = await admin
      .from('question_flags')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', abuseIdentity)
      .gte('created_at', cutoff);

    if (dailyCountError) {
      logger.error({ error: dailyCountError }, 'Failed to check daily flag rate limit');
      return NextResponse.json(
        { error: 'Failed to validate flagging limit' },
        { status: 500 }
      );
    }

    const { count: questionWindowCount, error: questionWindowError } = await admin
      .from('question_flags')
      .select('id', { count: 'exact', head: true })
      .eq('client_id', abuseIdentity)
      .eq('question_id', questionId)
      .gte('created_at', questionWindowCutoff);

    if (questionWindowError) {
      logger.error({ error: questionWindowError }, 'Failed to check per-question spam window');
      return NextResponse.json(
        { error: 'Failed to validate flagging limit' },
        { status: 500 }
      );
    }

    const rejection = getFlagAbuseRejection({
      dailyCount: dailyCount ?? 0,
      questionWindowCount: questionWindowCount ?? 0,
    });

    if (rejection) {
      logger.warn(
        { abuseIdentity, questionId, dailyCount, questionWindowCount },
        'Flagging abuse control blocked request'
      );
      return NextResponse.json(
        rejection,
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
        client_id: abuseIdentity,
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
