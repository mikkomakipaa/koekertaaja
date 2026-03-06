import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServerClient, requireAdmin, requireAuth, resolveAuthError, verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import { parseDatabaseQuestion } from '@/types/database';
import { createLogger } from '@/lib/logger';
import { findRelatedFlashcardCode } from '@/lib/supabase/queries';
import type { QuestionSet, QuestionSetStatus } from '@/types/questions';
import type { QuestionSet as PublicQuestionSet } from '@/types';

type FlagScope = 'play' | 'created';

type FlagRow = never;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.toUpperCase();
  const includeDrafts = url.searchParams.get('includeDrafts') === '1';
  const includeRelatedFlashcard = url.searchParams.get('relatedFlashcard') === '1';
  const scope = (url.searchParams.get('scope') as FlagScope | null) ?? 'play';

  if (code) {
    return getQuestionSetByCode(request, code, includeDrafts, includeRelatedFlashcard);
  }

  if (scope === 'created') {
    return getCreatedQuestionSets();
  }

  return getPlayableQuestionSets(request);
}

async function getQuestionSetByCode(
  request: NextRequest,
  code: string,
  includeDrafts: boolean,
  includeRelatedFlashcard: boolean
) {
  const logger = createLogger({
    requestId: crypto.randomUUID(),
    route: '/api/question-sets',
  });

  try {
    const user = await verifyAuth();
    const userIsAdmin = user ? isAdmin(user.email || '') : false;
    const supabase = userIsAdmin ? getSupabaseAdmin() : await createServerClient();
    const setQuery = supabase
      .from('question_sets')
      .select('*')
      .eq('code', code);

    if (!userIsAdmin || !includeDrafts) {
      setQuery.eq('status', 'published');
    }

    const { data: questionSet, error: setError } = await setQuery.single();

    if (setError || !questionSet) {
      return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
    }

    const questionsClient = userIsAdmin && includeDrafts ? getSupabaseAdmin() : supabase;
    const { data: dbQuestions, error: questionsError } = await questionsClient
      .from('questions')
      .select('*')
      .eq('question_set_id', (questionSet as any).id)
      .order('order_index', { ascending: true });

    if (questionsError || !dbQuestions) {
      logger.error({ error: questionsError }, 'Failed to load questions');
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 });
    }

    const questions = (dbQuestions as any[]).map(parseDatabaseQuestion);

    const responseData: Record<string, unknown> = {
      ...(questionSet as any),
      questions,
    };

    if (includeRelatedFlashcard) {
      try {
        responseData.relatedFlashcardCode = await findRelatedFlashcardCode(code);
      } catch (relatedFlashcardError) {
        logger.warn(
          { error: relatedFlashcardError, code },
          'Failed to resolve related flashcard code'
        );
        responseData.relatedFlashcardCode = null;
      }
    }

    return NextResponse.json({
      data: responseData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function getCreatedQuestionSets() {
  try {
    await requireAuth();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: questionSets, error } = await supabaseAdmin
      .from('question_sets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: 'Failed to load question sets' }, { status: 500 });
    }

    const typedQuestionSets = (questionSets || []) as PublicQuestionSet[];
    const setsWithDistribution = await Promise.all(
      typedQuestionSets.map(async (set) => {
        const { data: questions } = await supabaseAdmin
          .from('questions')
          .select('question_type, topic')
          .eq('question_set_id', set.id);

        const typeDistribution: Record<string, number> = {};
        const topicDistribution: Record<string, number> = {};
        if (questions) {
          (questions as Array<{ question_type: string; topic: string | null }>).forEach((q) => {
            typeDistribution[q.question_type] = (typeDistribution[q.question_type] || 0) + 1;
            const topicKey = q.topic ?? '__null__';
            topicDistribution[topicKey] = (topicDistribution[topicKey] || 0) + 1;
          });
        }

        return {
          ...set,
          type_distribution: typeDistribution,
          topic_distribution: topicDistribution,
        };
      })
    );

    return NextResponse.json({ data: setsWithDistribution });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

async function getPlayableQuestionSets(request: NextRequest) {
  try {
    const user = await verifyAuth();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 100;
    const modeParam = url.searchParams.get('mode');
    const mode = modeParam === 'flashcard' ? 'flashcard' : 'quiz';

    const userIsAdmin = user ? isAdmin(user.email || '') : false;
    const supabase = userIsAdmin ? getSupabaseAdmin() : await createServerClient();
    const query = supabase
      .from('question_sets')
      .select('*')
      .eq('mode', mode)
      .order('exam_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(Number.isFinite(limit) && limit > 0 ? limit : 100);

    if (!userIsAdmin) {
      query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to load question sets' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-sets' });

  logger.info({ method: 'PATCH' }, 'Request received');

  try {
    try {
      await requireAdmin(request);
      logger.info('Admin authentication successful');
    } catch (authError) {
      const { status, message } = resolveAuthError(authError, {
        unauthorized: 'Unauthorized. Please log in.',
        forbidden: 'Forbidden. Admin access required to publish question sets.',
      });
      logger.warn({ status, error: message }, 'Authentication failed');
      return NextResponse.json({ error: message }, { status });
    }

    const body = await request.json();
    const publishSchema = z.object({
      questionSetId: z.string().uuid('Invalid question set ID'),
      status: z.enum(['created', 'published'], {
        errorMap: () => ({ message: 'Status must be "created" or "published"' }),
      }),
    });

    const validationResult = publishSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const { questionSetId, status } = validationResult.data;
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
        return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
      }

      return NextResponse.json({ error: 'Failed to update question set status' }, { status: 500 });
    }

    if (!data) {
      logger.warn({ questionSetId }, 'Question set not found');
      return NextResponse.json({ error: 'Question set not found' }, { status: 404 });
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
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      },
      'Request failed'
    );

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
