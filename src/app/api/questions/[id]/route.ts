import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { requireAdmin } from '@/lib/supabase/server-auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const baseSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').max(2000, 'Question text is too long'),
  correctAnswer: z.unknown(),
  options: z.unknown().optional(),
  acceptableAnswers: z.array(z.string()).optional(),
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/questions/[id]' });

  const { id } = await context.params;

  logger.info({ method: 'PATCH', questionId: id }, 'Request received');

  try {
    try {
      await requireAdmin();
    } catch (authError) {
      logger.warn({ authError }, 'Admin access denied');
      return NextResponse.json(
        { error: 'Forbidden. Admin access required to edit questions.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = baseSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { questionText, correctAnswer, options, acceptableAnswers } = validationResult.data;

    const admin = getSupabaseAdmin();

    const { data: existingQuestion, error: fetchError } = await admin
      .from('questions')
      .select('id, question_type')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuestion) {
      logger.error({ error: fetchError }, 'Question not found');
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    const questionType = existingQuestion.question_type as string;
    let normalizedCorrectAnswer: any = correctAnswer;
    let normalizedOptions: any = undefined;

    switch (questionType) {
      case 'multiple_choice': {
        const schema = z.object({
          correctAnswer: z.string().min(1, 'Correct answer is required'),
          options: z.array(z.string().min(1)).min(2, 'At least two options are required'),
        });
        const parsed = schema.safeParse({ correctAnswer, options });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        normalizedOptions = parsed.data.options;
        break;
      }
      case 'multiple_select': {
        const schema = z.object({
          correctAnswer: z.array(z.string().min(1)).min(2).max(3),
          options: z.array(z.string().min(1)).length(5),
        });
        const parsed = schema.safeParse({ correctAnswer, options });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }

        const allCorrectInOptions = parsed.data.correctAnswer.every((answer) =>
          parsed.data.options.includes(answer)
        );
        if (!allCorrectInOptions) {
          return NextResponse.json(
            { error: 'Validation failed', details: ['correctAnswer: All correct answers must be present in options'] },
            { status: 400 }
          );
        }

        normalizedCorrectAnswer = parsed.data.correctAnswer;
        normalizedOptions = parsed.data.options;
        break;
      }
      case 'fill_blank': {
        const schema = z.object({
          correctAnswer: z.string().min(1, 'Correct answer is required'),
          acceptableAnswers: z.array(z.string().min(1)).optional(),
        });
        const parsed = schema.safeParse({ correctAnswer, acceptableAnswers });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        if (parsed.data.acceptableAnswers) {
          normalizedOptions = parsed.data.acceptableAnswers;
        }
        break;
      }
      case 'short_answer': {
        const schema = z.object({
          correctAnswer: z.string().min(1, 'Correct answer is required'),
          acceptableAnswers: z.array(z.string().min(1)).optional(),
        });
        const parsed = schema.safeParse({ correctAnswer, acceptableAnswers });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        if (parsed.data.acceptableAnswers) {
          normalizedOptions = parsed.data.acceptableAnswers;
        }
        break;
      }
      case 'true_false': {
        const schema = z.object({
          correctAnswer: z.boolean(),
        });
        const parsed = schema.safeParse({ correctAnswer });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        break;
      }
      case 'matching': {
        const schema = z.object({
          correctAnswer: z.array(
            z.object({
              left: z.string().min(1),
              right: z.string().min(1),
            })
          ).min(1, 'At least one pair is required'),
        });
        const parsed = schema.safeParse({ correctAnswer });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        break;
      }
      case 'sequential': {
        const schema = z.object({
          correctAnswer: z.object({
            items: z.array(z.union([
              z.string().min(1),
              z.object({ text: z.string().min(1), year: z.number().int().optional() }),
            ])).min(1, 'Items are required'),
            correct_order: z.array(z.number().int().min(0)).min(1, 'Correct order is required'),
          }),
        });
        const parsed = schema.safeParse({ correctAnswer });
        if (!parsed.success) {
          const errors = parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
          return NextResponse.json(
            { error: 'Validation failed', details: errors },
            { status: 400 }
          );
        }
        normalizedCorrectAnswer = parsed.data.correctAnswer;
        break;
      }
      default: {
        logger.warn({ questionType }, 'Unsupported question type');
        return NextResponse.json(
          { error: `Unsupported question type: ${questionType}` },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, any> = {
      question_text: questionText.trim(),
      correct_answer: normalizedCorrectAnswer,
    };

    if (normalizedOptions !== undefined) {
      updates.options = normalizedOptions;
    }

    const { data: updatedQuestion, error: updateError } = await admin
      .from('questions')
      .update(updates)
      .eq('id', id)
      .select('id, question_text, question_type, correct_answer, options')
      .single();

    if (updateError) {
      logger.error({ error: updateError }, 'Failed to update question');
      return NextResponse.json(
        { error: 'Failed to update question' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, question: updatedQuestion });
  } catch (error) {
    logger.error({ error }, 'Unhandled error in question update');
    return NextResponse.json(
      { error: 'Failed to update question', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
