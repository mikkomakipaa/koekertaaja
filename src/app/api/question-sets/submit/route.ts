import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty, Mode } from '@/types';
import { aiQuestionArraySchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import { z } from 'zod';

// Configure route segment for Vercel deployment
export const maxDuration = 60; // 1 minute timeout (no AI generation, just DB writes)

/**
 * POST /api/question-sets/submit
 *
 * Submit pre-generated questions from external workflows (OpenAI, custom pipelines, etc.)
 *
 * This endpoint bypasses AI generation and directly saves questions to the database.
 * Useful for integrating with external AI workflows, testing, or importing question banks.
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/question-sets/submit' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    // Verify authentication
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to submit question sets.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation schema for submission
    const submissionSchema = z.object({
      questionSetName: z
        .string()
        .min(1, 'Question set name is required')
        .max(200, 'Question set name must be 200 characters or less')
        .trim(),
      subject: z
        .string()
        .min(1, 'Subject is required')
        .max(100, 'Subject must be 100 characters or less')
        .trim(),
      difficulty: z.enum(['helppo', 'normaali'], {
        errorMap: () => ({ message: 'Difficulty must be "helppo" or "normaali"' }),
      }),
      mode: z.enum(['quiz', 'flashcard'], {
        errorMap: () => ({ message: 'Mode must be "quiz" or "flashcard"' }),
      }),
      grade: z
        .number()
        .int('Grade must be an integer')
        .min(1, 'Grade must be between 1-13')
        .max(13, 'Grade must be between 1-13')
        .optional(),
      topic: z
        .string()
        .max(200, 'Topic must be 200 characters or less')
        .optional(),
      subtopic: z
        .string()
        .max(200, 'Subtopic must be 200 characters or less')
        .optional(),
      questions: aiQuestionArraySchema.min(1, 'At least 1 question is required'),
    });

    // Validate request body
    const validationResult = submissionSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      logger.warn({ errors }, 'Validation failed');
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { questionSetName, subject, difficulty, mode, grade, topic, subtopic, questions } = validationResult.data;

    // CRITICAL: Validate flashcard mode restrictions
    if (mode === 'flashcard') {
      const invalidTypes = questions.filter(q =>
        ['multiple_choice', 'true_false', 'sequential'].includes(q.type)
      );

      if (invalidTypes.length > 0) {
        logger.warn(
          {
            invalidTypeCount: invalidTypes.length,
            invalidTypes: invalidTypes.map(q => q.type),
          },
          'Invalid question types for flashcard mode'
        );
        return NextResponse.json(
          {
            error: `Flashcard mode cannot include multiple_choice, true_false, or sequential questions (found ${invalidTypes.length} invalid questions)`,
            details: [
              'Flashcard mode is optimized for active recall and memorization.',
              'Use fill_blank, short_answer, or matching questions instead.',
            ],
          },
          { status: 400 }
        );
      }
    }

    // Check topic coverage for balanced question selection
    const questionsWithTopics = questions.filter(q => q.topic && q.topic.trim().length > 0).length;
    const topicCoverage = questions.length > 0 ? (questionsWithTopics / questions.length) * 100 : 0;

    if (topicCoverage < 70) {
      logger.warn(
        {
          questionsWithTopics,
          totalQuestions: questions.length,
          topicCoverage: `${topicCoverage.toFixed(1)}%`,
        },
        'Low topic coverage - assigning default topic'
      );

      // Assign default topic to questions missing topics
      const defaultTopic = subject;
      questions.forEach(q => {
        if (!q.topic || q.topic.trim().length === 0) {
          q.topic = defaultTopic;
        }
      });
    }

    logger.info(
      {
        questionCount: questions.length,
        subject,
        difficulty,
        mode,
        topicCoverage: `${topicCoverage.toFixed(1)}%`,
      },
      'Validated question set submission'
    );

    // Transform questions from API format to database format
    const transformedQuestions = questions.map((q, index) => ({
      question_text: q.question,
      question_type: q.type,
      topic: q.topic,
      correct_answer: q.correct_answer,
      options: q.options,
      pairs: q.pairs,
      items: q.items,
      correct_order: q.correct_order,
      acceptable_answers: q.acceptable_answers,
      explanation: q.explanation,
      order_index: index,
      id: '', // Will be set by database
      question_set_id: '', // Will be set by database
    }));

    // Generate unique code with collision handling
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 50;
    let dbResult = null;

    while (attempts < maxAttempts && !dbResult) {
      dbResult = await createQuestionSet(
        {
          code,
          name: questionSetName,
          subject: subject as Subject,
          difficulty: difficulty as Difficulty,
          mode: mode as Mode,
          grade,
          topic,
          subtopic,
          question_count: questions.length,
        },
        transformedQuestions as any
      );

      if (!dbResult) {
        attempts++;
        code = generateCode();

        if (attempts % 10 === 0) {
          logger.warn({ attempts }, 'Code collision detected');
        }

        if (attempts > 30) {
          logger.error({ attempts }, 'High collision rate detected');
        }
      }
    }

    if (!dbResult) {
      logger.error({ maxAttempts }, 'Failed to generate unique code');
      return NextResponse.json(
        { error: `Failed to create question set. Please try again.` },
        { status: 500 }
      );
    }

    const response = {
      success: true,
      code: dbResult.code,
      questionSet: {
        id: dbResult.questionSet.id,
        code: dbResult.questionSet.code,
        name: dbResult.questionSet.name,
        subject: dbResult.questionSet.subject,
        difficulty: dbResult.questionSet.difficulty,
        mode: dbResult.questionSet.mode,
        question_count: dbResult.questionSet.question_count,
        created_at: dbResult.questionSet.created_at,
      },
      questionCount: questions.length,
    };

    logger.info(
      {
        code: dbResult.code,
        questionCount: questions.length,
      },
      'Question set created successfully'
    );

    return NextResponse.json(response);
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error server-side with logger
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
          ? 'Failed to submit question set. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
