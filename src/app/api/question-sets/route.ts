import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { createServerClient, requireAdmin, requireAuth, resolveAuthError, verifyAuth } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';
import { getSchoolForUser } from '@/lib/auth/roles';
import { normalizeTopicLabel } from '@/lib/topics/normalization';
import { parseDatabaseQuestion } from '@/types/database';
import { createLogger } from '@/lib/logger';
import { findRelatedFlashcardCode, findRelatedNormalCode } from '@/lib/supabase/queries';
import type { QuestionSet, QuestionSetStatus } from '@/types/questions';
import type { QuestionSet as PublicQuestionSet } from '@/types';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';

type FlagScope = 'play' | 'created' | 'manage';

type FlagRow = never;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.toUpperCase();
  const includeDrafts = url.searchParams.get('includeDrafts') === '1';
  const includeRelatedFlashcard = url.searchParams.get('relatedFlashcard') === '1';
  const includeRelatedNormal = url.searchParams.get('relatedNormal') === '1';
  const scope = (url.searchParams.get('scope') as FlagScope | null) ?? 'play';

  if (code) {
    return getQuestionSetByCode(
      request,
      code,
      includeDrafts,
      includeRelatedFlashcard,
      includeRelatedNormal
    );
  }

  if (scope === 'manage') {
    return getManageQuestionSets();
  }

  if (scope === 'created') {
    return getCreatedQuestionSets();
  }

  return getPlayableQuestionSets(request);
}

const createQuestionSetRequestSchema = z.object({
  name: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(100),
  subjectType: z.enum(['language', 'math', 'written', 'skills', 'concepts', 'geography']).optional(),
  grade: z.number().int().min(1).max(13).optional(),
  difficulty: z.enum(['helppo', 'normaali']).optional(),
  mode: z.enum(['quiz', 'flashcard']),
  topic: z.string().trim().max(200).optional(),
  subtopic: z.string().trim().max(200).optional(),
  examLength: z.number().int().min(1).max(20).optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['created', 'published']).optional(),
  questions: z.array(z.any()).min(1),
});

async function resolveSchoolIdForCreate(userId: string, request: NextRequest): Promise<string> {
  const requestedSchoolId = request.headers.get('x-school-id')?.trim() || undefined;
  const membership = await getSchoolForUser(userId, requestedSchoolId);

  if (!membership) {
    throw new Error('Tiliäsi ei ole liitetty kouluun.');
  }

  return membership.school_id;
}

async function getQuestionSetByCode(
  request: NextRequest,
  code: string,
  includeDrafts: boolean,
  includeRelatedFlashcard: boolean,
  includeRelatedNormal: boolean
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

    if (includeRelatedNormal) {
      try {
        responseData.relatedNormalCode = await findRelatedNormalCode(code);
      } catch (relatedNormalError) {
        logger.warn(
          { error: relatedNormalError, code },
          'Failed to resolve related normal code'
        );
        responseData.relatedNormalCode = null;
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
    const user = await requireAuth();

    const supabaseAdmin = getSupabaseAdmin();
    const { data: questionSets, error } = await supabaseAdmin
      .from('question_sets')
      .select('*')
      .eq('user_id', user.id)
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

async function getManageQuestionSets() {
  try {
    const user = await requireAuth();
    const userIsAdmin = isAdmin(user.email || '');
    const supabaseAdmin = getSupabaseAdmin();

    let query = supabaseAdmin
      .from('question_sets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!userIsAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: questionSets, error } = await query;

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
    const schoolId = url.searchParams.get('schoolId');

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

    if (schoolId) {
      query.eq('school_id', schoolId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to load question sets' }, { status: 500 });
    }

    const questionSets = (data || []) as PublicQuestionSet[];

    if (questionSets.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const setModeById = new Map(questionSets.map((set) => [set.id, set.mode]));
    const { data: questionRows, error: questionsError } = await supabase
      .from('questions')
      .select('question_set_id, question_type, topic')
      .in('question_set_id', questionSets.map((set) => set.id));

    if (questionsError) {
      return NextResponse.json({ error: 'Failed to load question set topics' }, { status: 500 });
    }

    const topicDistributionBySetId = new Map<string, Record<string, number>>();

    for (const row of (questionRows || []) as Array<{
      question_set_id: string;
      question_type: string;
      topic: string | null;
    }>) {
      const setMode = setModeById.get(row.question_set_id);
      if (!setMode) {
        continue;
      }

      if (setMode === 'quiz' && row.question_type === 'flashcard') {
        continue;
      }

      const normalizedTopic = row.topic ? normalizeTopicLabel(row.topic, { context: 'api.question-sets.playable' }).trim() : '';
      if (!normalizedTopic) {
        continue;
      }

      const currentDistribution = topicDistributionBySetId.get(row.question_set_id) ?? {};
      currentDistribution[normalizedTopic] = (currentDistribution[normalizedTopic] ?? 0) + 1;
      topicDistributionBySetId.set(row.question_set_id, currentDistribution);
    }

    return NextResponse.json({
      data: questionSets.map((set) => ({
        ...set,
        topic_distribution: topicDistributionBySetId.get(set.id) ?? {},
      })),
    });
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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-sets' });

  logger.info({ method: 'POST' }, 'Create question set request received');

  try {
    let userId = '';
    try {
      const user = await requireAdmin(request);
      userId = user.id;
      logger.info({ userId }, 'Admin authentication successful');
    } catch (authError) {
      const { status, message } = resolveAuthError(authError, {
        unauthorized: 'Unauthorized. Please log in.',
        forbidden: 'Forbidden. Admin access required to create question sets.',
      });
      return NextResponse.json({ error: message }, { status });
    }

    const schoolId = await resolveSchoolIdForCreate(userId, request);
    const body = await request.json();
    const validationResult = createQuestionSetRequestSchema.safeParse(body);

    if (!validationResult.success) {
      const details = validationResult.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`);
      return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
    }

    const payload = validationResult.data;
    const questions = payload.questions.map((question: any, index: number) => ({
      question_text: question.question_text,
      question_type: question.question_type,
      difficulty: question.difficulty ?? null,
      explanation: question.explanation,
      image_url: question.image_url,
      image_reference: question.image_reference,
      requires_visual: question.requires_visual,
      order_index: index,
      topic: question.topic,
      skill: question.skill,
      subtopic: question.subtopic,
      correct_answer:
        question.question_type === 'multiple_select'
          ? question.correct_answers
          : question.question_type === 'matching'
            ? question.pairs
            : question.question_type === 'sequential'
              ? {
                  items: question.items,
                  correct_order: question.correct_order,
                }
              : question.correct_answer,
      options:
        question.question_type === 'multiple_choice'
        || question.question_type === 'multiple_select'
        || question.question_type === 'fill_blank'
        || question.question_type === 'short_answer'
          ? question.options ?? question.acceptable_answers ?? null
          : null,
    }));

    let code = generateCode();
    let attempts = 0;

    while (attempts < 50) {
      const result = await createQuestionSet(
        {
          code,
          user_id: userId,
          school_id: schoolId,
          name: payload.name,
          subject: payload.subject,
          difficulty: payload.mode === 'flashcard' ? 'normaali' : (payload.difficulty ?? 'normaali'),
          mode: payload.mode,
          grade: payload.grade,
          topic: payload.topic,
          subtopic: payload.subtopic,
          subject_type: payload.subjectType,
          question_count: questions.length,
          exam_length: payload.examLength,
          exam_date: payload.examDate ?? null,
          status: payload.status ?? 'created',
        },
        questions
      );

      if (result.success) {
        return NextResponse.json({
          success: true,
          questionSet: {
            id: result.questionSet.id,
            code: result.code,
            name: result.questionSet.name,
            difficulty: result.questionSet.difficulty,
            mode: result.questionSet.mode,
            questionCount: result.questionSet.question_count,
          },
        });
      }

      if (result.reason !== 'duplicate_code') {
        return NextResponse.json(
          {
            error: result.error?.message ?? 'Failed to create question set',
          },
          { status: 500 }
        );
      }

      attempts += 1;
      code = generateCode();
    }

    return NextResponse.json(
      { error: 'Failed to generate unique code for question set' },
      { status: 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message === 'Tiliäsi ei ole liitetty kouluun.' ? 403 : 500;
    logger.error({ error: message }, 'Failed to create question set');
    return NextResponse.json({ error: message }, { status });
  }
}
