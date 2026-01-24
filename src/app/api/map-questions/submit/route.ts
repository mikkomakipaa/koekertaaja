import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import { createMapQuestion } from '@/lib/supabase/write-queries';

const mapRegionSchema = z.object({
  id: z.string().min(1, 'Region id is required').max(100, 'Region id must be 100 characters or less'),
  label: z.string().min(1, 'Region label is required').max(200, 'Region label must be 200 characters or less'),
  aliases: z.array(z.string().min(1).max(200)).optional(),
});

const mapQuestionSubmitSchema = z.object({
  questionSetId: z.string().uuid().nullable().optional(),
  subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be 100 characters or less').trim(),
  grade: z.number().int().min(1).max(13).nullable().optional(),
  difficulty: z.enum(['helppo', 'normaali']).nullable().optional(),
  question: z.string().min(5, 'Question must be at least 5 characters').max(1000).trim(),
  explanation: z.string().min(10, 'Explanation must be at least 10 characters').max(2000).trim(),
  topic: z.string().max(200).optional(),
  subtopic: z.string().max(200).optional(),
  skill: z.string().regex(/^[a-z_]+$/).max(100).optional(),
  mapAsset: z.string().min(1, 'Map asset is required').max(500).trim(),
  inputMode: z.enum(['single_region', 'multi_region', 'text']),
  regions: z.array(mapRegionSchema).min(1, 'At least one region is required'),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  acceptableAnswers: z.array(z.string().min(1)).optional(),
  metadata: z.record(z.unknown()).optional(),
}).superRefine((data, ctx) => {
  if (data.inputMode === 'multi_region') {
    if (!Array.isArray(data.correctAnswer) || data.correctAnswer.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'multi_region inputMode requires an array of region ids for correctAnswer',
        path: ['correctAnswer'],
      });
    }
  } else if (typeof data.correctAnswer !== 'string' || data.correctAnswer.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'single_region and text inputMode require a string correctAnswer',
      path: ['correctAnswer'],
    });
  }
});

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/map-questions/submit' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to create map questions.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = mapQuestionSubmitSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const {
      questionSetId,
      subject,
      grade,
      difficulty,
      question,
      explanation,
      topic,
      subtopic,
      skill,
      mapAsset,
      inputMode,
      regions,
      correctAnswer,
      acceptableAnswers,
      metadata,
    } = validationResult.data;

    const created = await createMapQuestion({
      question_set_id: questionSetId ?? null,
      subject,
      grade: grade ?? null,
      difficulty: difficulty ?? null,
      question,
      explanation,
      topic: topic?.trim() || null,
      subtopic: subtopic?.trim() || null,
      skill: skill?.trim() || null,
      map_asset: mapAsset,
      input_mode: inputMode,
      regions,
      correct_answer: correctAnswer,
      acceptable_answers: acceptableAnswers?.length ? acceptableAnswers : null,
      metadata: metadata ?? {},
    });

    if (!created) {
      logger.error('Failed to create map question');
      return NextResponse.json(
        { error: 'Failed to create map question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, mapQuestion: created });
  } catch (error) {
    logger.error({ error }, 'Unexpected error');
    return NextResponse.json({ error: 'Unexpected error creating map question' }, { status: 500 });
  }
}
