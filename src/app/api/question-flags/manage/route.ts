import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

type FlagRow = {
  question_id: string;
  question_set_id: string;
  reason: 'wrong_answer' | 'ambiguous' | 'typo' | 'other';
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

export async function GET() {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags/manage' });

  logger.info({ method: 'GET' }, 'Request received');

  try {
    try {
      await requireAdmin();
    } catch (authError) {
      logger.warn({ authError }, 'Admin access denied');
      return NextResponse.json(
        { error: 'Forbidden. Admin access required to view flags.' },
        { status: 403 }
      );
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('question_flags')
      .select(
        'question_id, question_set_id, reason, created_at, questions(id, question_text, question_type, correct_answer, options), question_sets(id, name, code, subject)'
      );

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
      if (existing.reasonCounts && flag.reason in existing.reasonCounts) {
        existing.reasonCounts[flag.reason] += 1;
      }
    });

    const results = Array.from(aggregated.values()).sort((a, b) => {
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

const dismissSchema = z.object({
  questionId: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-flags/manage' });

  logger.info({ method: 'DELETE' }, 'Request received');

  try {
    try {
      await requireAdmin();
    } catch (authError) {
      logger.warn({ authError }, 'Admin access denied');
      return NextResponse.json(
        { error: 'Forbidden. Admin access required to manage flags.' },
        { status: 403 }
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

    const { error } = await admin
      .from('question_flags')
      .delete()
      .eq('question_id', questionId);

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
