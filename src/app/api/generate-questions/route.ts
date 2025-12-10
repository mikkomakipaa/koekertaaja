import { NextRequest, NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { identifyTopics } from '@/lib/ai/topicIdentifier';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty } from '@/types';
import { createQuestionSetSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';

// Configure route segment for Vercel deployment
export const maxDuration = 300; // 5 minutes timeout for AI generation

// Configure route to handle larger request bodies
// Max: 5 files × 5MB each = 25MB + text content + overhead = 30MB total
// Note: Next.js App Router uses bodyParser from next.config.js
// This route uses FormData which bypasses the default body parser

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-questions' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    // Verify authentication
    try {
      await requireAuth();
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to create question sets.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    // Extract form data
    const rawData = {
      subject: formData.get('subject') as string,
      questionCount: parseInt(formData.get('questionCount') as string),
      examLength: parseInt(formData.get('examLength') as string),
      questionSetName: formData.get('questionSetName') as string,
      grade: formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined,
      topic: (formData.get('topic') as string | null) || undefined,
      subtopic: (formData.get('subtopic') as string | null) || undefined,
      materialText: (formData.get('materialText') as string | null) || undefined,
    };

    const generationMode = (formData.get('generationMode') as string) || 'quiz';

    // Validate generation mode
    if (!['quiz', 'flashcard', 'both'].includes(generationMode)) {
      return NextResponse.json(
        { error: 'Invalid generation mode. Must be "quiz", "flashcard", or "both"' },
        { status: 400 }
      );
    }

    // Validate input with Zod schema
    const validationResult = createQuestionSetSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const { subject, questionCount, examLength, questionSetName, grade, topic, subtopic, materialText } = validationResult.data;

    // Process uploaded files with validation
    // Note: Vercel Hobby tier has 5MB request body limit
    // Reduced limits to work within this constraint (2MB × 2 files = 4MB + overhead)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB per file
    const MAX_FILES = 2; // Max 2 files to stay under 5MB total request limit
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];

    const files: Array<{ type: string; name: string; data: string }> = [];
    const fileEntries = Array.from(formData.entries()).filter(([key]) =>
      key.startsWith('file_')
    );

    // Validate file count
    if (fileEntries.length > MAX_FILES) {
      return NextResponse.json(
        {
          error: `Maximum ${MAX_FILES} files allowed. This limit ensures requests stay under the 5MB total size limit.`,
          details: 'For larger uploads, consider splitting materials or using text input instead of files.'
        },
        { status: 400 }
      );
    }

    // Estimate total request size to prevent "Request Entity Too Large" errors
    let totalSize = (materialText?.length || 0);
    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        totalSize += value.size;
      }
    }

    // Vercel Hobby tier has 5MB request limit, keep some margin for overhead
    const MAX_TOTAL_SIZE = 4.5 * 1024 * 1024; // 4.5MB
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          error: `Total request size (${Math.round(totalSize / 1024 / 1024 * 10) / 10}MB) exceeds the 4.5MB limit.`,
          details: 'Please reduce file sizes, use fewer files, or shorten the text material.'
        },
        { status: 413 }
      );
    }

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${value.name}" exceeds 2MB limit. Please use smaller files or reduce the number of files.` },
            { status: 400 }
          );
        }

        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Validate file type using magic bytes (server-side validation)
        const detectedType = await fileTypeFromBuffer(buffer);

        // For text files, fileTypeFromBuffer returns undefined
        // Check if it's actually text content
        const isTextFile = value.type.startsWith('text/') && !detectedType;

        if (!isTextFile && (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime))) {
          return NextResponse.json(
            {
              error: `File "${value.name}" has invalid type. Allowed: PDF, images (JPEG, PNG, GIF, WebP), or text files.`,
            },
            { status: 400 }
          );
        }

        const base64 = buffer.toString('base64');
        files.push({
          type: detectedType?.mime || 'text/plain',
          name: value.name,
          data: base64,
        });
      }
    }

    // Validate that we have some material
    if (!materialText && files.length === 0) {
      return NextResponse.json(
        { error: 'Please provide material (text or files)' },
        { status: 400 }
      );
    }

    // STEP 1: Identify topics from material (orchestrated AI architecture)
    logger.info('Step 1: Identifying topics from material');
    const topicAnalysis = await identifyTopics({
      subject,
      grade,
      materialText,
      materialFiles: files.length > 0 ? files : undefined,
    });

    logger.info(
      {
        identifiedTopics: topicAnalysis.topics,
        topicCount: topicAnalysis.topics.length,
      },
      'Topics identified successfully'
    );

    // Calculate flashcard question count: ~10 cards per topic
    const CARDS_PER_TOPIC = 10;
    const flashcardQuestionCount = topicAnalysis.topics.length * CARDS_PER_TOPIC;

    logger.info(
      {
        topicCount: topicAnalysis.topics.length,
        cardsPerTopic: CARDS_PER_TOPIC,
        totalFlashcards: flashcardQuestionCount,
      },
      'Calculated flashcard generation count'
    );

    // Define all difficulty levels
    const difficulties: Difficulty[] = ['helppo', 'normaali'];

    // STEP 2: Generate questions in parallel (Quiz + Flashcard)
    logger.info('Step 2: Generating questions (parallel execution)');

    // Prepare parallel generation tasks
    const generationTasks: Promise<{
      questions: any[];
      difficulty?: Difficulty;
      mode: 'quiz' | 'flashcard';
    }>[] = [];

    // Add quiz generation tasks
    if (generationMode === 'quiz' || generationMode === 'both') {
      for (const difficulty of difficulties) {
        generationTasks.push(
          generateQuestions({
            subject,
            difficulty,
            questionCount: questionCount, // Use pool size (40-400), not session length
            grade,
            materialText,
            materialFiles: files.length > 0 ? files : undefined,
            mode: 'quiz',
            identifiedTopics: topicAnalysis.topics, // Pass identified topics
          }).then((questions) => ({ questions, difficulty, mode: 'quiz' as const }))
        );
      }
    }

    // Add flashcard generation task
    if (generationMode === 'flashcard' || generationMode === 'both') {
      generationTasks.push(
        generateQuestions({
          subject,
          difficulty: 'normaali', // Flashcards use normaali as placeholder
          questionCount: flashcardQuestionCount, // Generate ~10 cards per topic
          grade,
          materialText,
          materialFiles: files.length > 0 ? files : undefined,
          mode: 'flashcard',
          identifiedTopics: topicAnalysis.topics, // Pass identified topics
        }).then((questions) => ({ questions, mode: 'flashcard' as const }))
      );
    }

    // Execute all generation tasks in parallel
    const generationResults = await Promise.all(generationTasks);

    logger.info(
      {
        totalSets: generationResults.length,
        modes: generationResults.map(r => r.mode),
      },
      'Question generation completed'
    );

    // STEP 3: Create question sets in database
    logger.info('Step 3: Saving question sets to database');
    const createdSets: any[] = [];

    for (const result of generationResults) {
      const { questions, difficulty, mode } = result;

      if (questions.length === 0) {
        logger.warn({ mode, difficulty }, 'No questions generated for this set');
        continue;
      }

      // Generate unique code with collision handling
      let code = generateCode();
      let attempts = 0;
      const maxAttempts = 50;
      let dbResult = null;

      // Determine set name based on mode and difficulty
      const setName = mode === 'flashcard'
        ? `${questionSetName} - Kortit`
        : `${questionSetName} - ${difficulty!.charAt(0).toUpperCase() + difficulty!.slice(1)}`;

      while (attempts < maxAttempts && !dbResult) {
        dbResult = await createQuestionSet(
          {
            code,
            name: setName,
            subject: subject as Subject,
            difficulty: difficulty || 'normaali',
            mode,
            grade,
            topic,
            subtopic,
            question_count: questions.length,
          },
          questions
        );

        if (!dbResult) {
          attempts++;
          code = generateCode();

          if (attempts % 10 === 0) {
            logger.warn({ attempts, mode, difficulty }, 'Code collision detected');
          }

          if (attempts > 30) {
            logger.error({ attempts }, 'High collision rate detected');
          }
        }
      }

      if (!dbResult) {
        logger.error({ maxAttempts, mode, difficulty }, 'Failed to generate unique code');
        return NextResponse.json(
          { error: `Failed to create question set. Please try again.` },
          { status: 500 }
        );
      }

      createdSets.push(dbResult);
    }

    const response = {
      success: true,
      message: `Created ${createdSets.length} question sets`,
      questionSets: createdSets.map(set => ({
        code: set.code,
        name: set.questionSet.name,
        difficulty: set.questionSet.difficulty,
        mode: set.questionSet.mode,
        questionCount: set.questionSet.question_count,
      })),
      totalQuestions: createdSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
    };

    logger.info(
      {
        questionSetsCount: createdSets.length,
        totalQuestions: response.totalQuestions,
      },
      'Request completed successfully'
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
          ? 'Failed to generate questions. Please try again later.'
          : error instanceof Error
          ? error.message
          : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
