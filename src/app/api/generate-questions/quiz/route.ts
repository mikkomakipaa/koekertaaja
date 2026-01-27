import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import { createQuestionSetSchema } from '@/lib/validation/schemas';
import {
  identifyTopicsFromMaterial,
  processUploadedFiles,
  generateQuizSets,
  QuizGenerationRequest,
} from '@/lib/api/questionGeneration';
import { Difficulty } from '@/types';

// Configure route segment for Vercel deployment
export const maxDuration = 240; // 4 minutes for quiz generation

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-questions/quiz' });

  logger.info({ method: 'POST' }, 'Quiz generation request received');

  try {
    // Verify authentication
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to generate quiz questions.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const targetWordsRaw = formData.get('targetWords') as string | null;
    const targetWords = targetWordsRaw
      ? targetWordsRaw.split(',').map(w => w.trim()).filter(Boolean)
      : undefined;

    const identifiedTopicsRaw = formData.get('identifiedTopics') as string | null;
    const identifiedTopics = identifiedTopicsRaw
      ? JSON.parse(identifiedTopicsRaw)
      : undefined;

    const rawData = {
      subject: formData.get('subject') as string,
      questionCount: parseInt(formData.get('questionCount') as string),
      examLength: parseInt(formData.get('examLength') as string),
      questionSetName: formData.get('questionSetName') as string,
      grade: formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined,
      topic: (formData.get('topic') as string | null) || undefined,
      subtopic: (formData.get('subtopic') as string | null) || undefined,
      materialText: (formData.get('materialText') as string | null) || undefined,
      subjectType: (formData.get('subjectType') as string | null) || undefined,
      targetWords,
    };

    // Validate input with Zod schema
    const validationResult = createQuestionSetSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const {
      subject,
      subjectType,
      questionCount,
      examLength,
      questionSetName,
      grade,
      topic,
      subtopic,
      materialText,
      targetWords: validatedTargetWords,
    } = validationResult.data;

    // Process uploaded files
    const { files, error: fileError } = await processUploadedFiles(formData);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { status: 400 });
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return NextResponse.json(
        { error: 'Please provide material (text or files) for quiz generation' },
        { status: 400 }
      );
    }

    logger.info(
      {
        subject,
        questionCount,
        hasTopics: !!identifiedTopics,
        hasText: !!materialText,
        fileCount: files.length,
      },
      'Starting quiz generation'
    );

    // Step 1: Identify topics (if not provided)
    let topics = identifiedTopics;
    if (!topics) {
      logger.info('Topics not provided, identifying topics from material');
      topics = await identifyTopicsFromMaterial({
        subject,
        grade,
        materialText,
        materialFiles: files.length > 0 ? files : undefined,
      });
    } else {
      logger.info(
        { topicCount: topics.length },
        'Using pre-identified topics'
      );
    }

    // Step 2: Generate quiz sets (helppo + normaali)
    const difficulties: Difficulty[] = ['helppo', 'normaali'];

    const quizRequest: QuizGenerationRequest = {
      subject,
      subjectType,
      questionCount,
      examLength,
      questionSetName,
      grade,
      topic,
      subtopic,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
      targetWords: validatedTargetWords,
      identifiedTopics: topics,
      difficulties,
    };

    const quizSets = await generateQuizSets(quizRequest);

    logger.info(
      {
        setsCreated: quizSets.length,
        codes: quizSets.map(s => s.code),
        totalQuestions: quizSets.reduce((sum, s) => sum + s.questionSet.question_count, 0),
      },
      'Quiz generation completed successfully'
    );

    return NextResponse.json({
      success: true,
      questionSets: quizSets.map(set => ({
        code: set.code,
        name: set.questionSet.name,
        difficulty: set.questionSet.difficulty,
        mode: set.questionSet.mode,
        questionCount: set.questionSet.question_count,
      })),
      totalQuestions: quizSets.reduce((sum, s) => sum + s.questionSet.question_count, 0),
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log full error server-side
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: isProduction ? undefined : error instanceof Error ? error.stack : undefined,
      },
      'Quiz generation failed'
    );

    // Return sanitized error to client
    return NextResponse.json(
      {
        error: isProduction
          ? 'Failed to generate quiz questions. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
