import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { isAdmin } from '@/lib/auth/admin';
import { createLogger } from '@/lib/logger';
import {
  requireAuth,
  resolveAuthError,
} from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { buildServerRateLimitKey } from '@/lib/ratelimit';
import { requireSchoolMember } from '@/lib/auth/roles';
import {
  flagSchema,
  PER_QUESTION_WINDOW_MS,
  getFlagAbuseRejection,
} from '@/lib/question-flags/abuse-controls';

type FlagRow = {
  question_id: string;
  question_set_id: string;
  reason: 'wrong_answer' | 'ambiguous' | 'typo' | 'other';
  note: string | null;
  created_at: string | null;
  questions: {
    id: string;
    question_text: string;
    question_type: string;
    correct_answer: any;
    options: any;
  } | null;
  question_sets: {
    id: string;
    name: string | null;
    code: string | null;
    subject: string | null;
  } | null;
};

const dismissSchema = z.object({
  questionId: z.string().uuid(),
});

async function getOwnedQuestionSetIds(userId: string): Promise<string[]> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('question_sets')
    .select('id')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => row.id as string);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    let userId: string;
    try {
      const user = await requireAuth(request);
      userId = user.id;
    } catch (authError) {
      const { status, message } = resolveAuthError(authError, {
        unauthorized: 'Unauthorized. Please log in to submit flags.',
      });
      logger.warn({ authError: message, status }, 'Authentication failed');
      return NextResponse.json({ error: message }, { status });
    }

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
    const abuseIdentity = buildServerRateLimitKey(request.headers, {
      prefix: 'question-flags',
      userId,
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

export async function GET() {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags' });

  logger.info({ method: 'GET' }, 'Request received');

  try {
    let userId: string;
    let userIsGlobalAdmin = false;

    try {
      const user = await requireAuth();
      userId = user.id;
      userIsGlobalAdmin = isAdmin(user.email || '');

      if (!userIsGlobalAdmin) {
        await requireSchoolMember(user.id);
      }
    } catch (authError) {
      logger.warn({ authError }, 'Flag access denied');
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to flagged questions.' },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    let query = admin
      .from('question_flags')
      .select(
        'question_id, question_set_id, reason, note, created_at, questions(id, question_text, question_type, correct_answer, options), question_sets(id, name, code, subject)'
      );

    if (!userIsGlobalAdmin) {
      const ownedQuestionSetIds = await getOwnedQuestionSetIds(userId);
      if (ownedQuestionSetIds.length === 0) {
        return NextResponse.json({ data: [] });
      }
      query = query.in('question_set_id', ownedQuestionSetIds);
    }

    const { data, error } = await query;

    if (error) {
      logger.error({ error }, 'Failed to load flagged questions');
      return NextResponse.json(
        { error: 'Failed to load flagged questions' },
        { status: 500 }
      );
    }

    const aggregated = new Map<string, any>();
    const rows = (data ?? []) as FlagRow[];

    rows.forEach((flag) => {
      const question = flag.questions;
      const questionSet = flag.question_sets;

      if (!question) {
        return;
      }

      const key = flag.question_id as string;
      const existing = aggregated.get(key);

      if (!existing) {
        aggregated.set(key, {
          questionId: flag.question_id,
          questionSetId: flag.question_set_id,
          questionText: question.question_text,
          questionType: question.question_type,
          correctAnswer: question.correct_answer,
          options: question.options,
          questionSetName: questionSet?.name ?? null,
          questionSetCode: questionSet?.code ?? null,
          subject: questionSet?.subject ?? null,
          flagCount: 1,
          latestFlagAt: flag.created_at,
          latestNote: flag.note || null,
          latestNoteAt: flag.note ? flag.created_at : null,
          reasonCounts: {
            wrong_answer: flag.reason === 'wrong_answer' ? 1 : 0,
            ambiguous: flag.reason === 'ambiguous' ? 1 : 0,
            typo: flag.reason === 'typo' ? 1 : 0,
            other: flag.reason === 'other' ? 1 : 0,
          },
        });
        return;
      }

      existing.flagCount += 1;
      if (flag.created_at && (!existing.latestFlagAt || flag.created_at > existing.latestFlagAt)) {
        existing.latestFlagAt = flag.created_at;
      }
      if (flag.note) {
        if (!existing.latestNoteAt || (flag.created_at && flag.created_at > existing.latestNoteAt)) {
          existing.latestNote = flag.note;
          existing.latestNoteAt = flag.created_at;
        }
      }
      if (existing.reasonCounts && flag.reason in existing.reasonCounts) {
        existing.reasonCounts[flag.reason] += 1;
      }
    });

    const results = Array.from(aggregated.values())
      .map(({ latestNoteAt, ...rest }) => rest)
      .sort((a, b) => {
        if (b.flagCount !== a.flagCount) return b.flagCount - a.flagCount;
        return (b.latestFlagAt || '').localeCompare(a.latestFlagAt || '');
      });

    return NextResponse.json({ data: results });
  } catch (error) {
    logger.error({ error }, 'Unhandled error in flagged question management');
    return NextResponse.json(
      { error: 'Failed to load flagged questions' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags' });

  logger.info({ method: 'DELETE' }, 'Request received');

  try {
    let userId: string;
    let userIsGlobalAdmin = false;

    try {
      const user = await requireAuth(request);
      userId = user.id;
      userIsGlobalAdmin = isAdmin(user.email || '');

      if (!userIsGlobalAdmin) {
        await requireSchoolMember(user.id);
      }
    } catch (authError) {
      const { status, message } = resolveAuthError(authError, {
        unauthorized: 'Unauthorized. Please log in.',
        forbidden: 'Forbidden. You do not have access to manage flags.',
      });
      logger.warn({ authError: message, status }, 'Flag management access denied');
      return NextResponse.json(
        { error: message },
        { status }
      );
    }

    const body = await request.json();
    const validationResult = dismissSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { questionId } = validationResult.data;
    const admin = getSupabaseAdmin();
    const ownedQuestionSetIds = userIsGlobalAdmin ? null : await getOwnedQuestionSetIds(userId);

    if (!userIsGlobalAdmin && (!ownedQuestionSetIds || ownedQuestionSetIds.length === 0)) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to manage flags.' },
        { status: 403 }
      );
    }

    let deleteQuery = admin
      .from('question_flags')
      .delete()
      .eq('question_id', questionId);

    if (ownedQuestionSetIds) {
      deleteQuery = deleteQuery.in('question_set_id', ownedQuestionSetIds);
    }

    const { error } = await deleteQuery;

    if (error) {
      logger.error({ error }, 'Failed to dismiss flags');
      return NextResponse.json(
        { error: 'Failed to dismiss flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Unhandled error in flag dismissal');
    return NextResponse.json(
      { error: 'Failed to dismiss flags' },
      { status: 500 }
    );
  }
}
