import { NextRequest, NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { identifyTopics, getSimpleTopics } from '@/lib/ai/topicIdentifier';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty } from '@/types';
import { createQuestionSetSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';
import { requireAuth } from '@/lib/supabase/server-auth';
import {
  checkRateLimit,
  getClientIp,
  buildRateLimitKey,
  createRateLimitHeaders,
} from '@/lib/ratelimit';
import { analyzeQuestionSetQuality, orchestrateQuestionSet } from '@/lib/utils/questionOrdering';
import { analyzeMaterialCapacity, validateQuestionCount } from '@/lib/utils/materialAnalysis';
import type { Question } from '@/types';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';
import type { PromptMetadata } from '@/lib/prompts/promptVersion';

// Configure route segment for Vercel deployment
export const maxDuration = 300; // 5 minutes timeout for AI generation

// Configure route to handle larger request bodies
// Max: 1 file × 5MB + text content + overhead = ~5MB total
// Note: Next.js App Router uses bodyParser from next.config.js
// This route uses FormData which bypasses the default body parser

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-questions' });
  let baseHeaders: Headers | undefined;

  logger.info({ method: 'POST' }, 'Request received');

  try {
    const clientIp = getClientIp(request.headers);
    const clientId = request.headers.get('x-client-id') || request.headers.get('x-clientid') || undefined;
    let userId: string | undefined;

    // Verify authentication
    try {
      const user = await requireAuth();
      userId = user.id;
      logger.info('Authentication successful');
    } catch (authError) {
      logger.warn('Authentication failed');
    }

    const rateLimitKey = buildRateLimitKey({
      ip: clientIp,
      userId,
      clientId,
      prefix: 'generate-questions',
    });
    const rateLimitResult = process.env.NODE_ENV === 'development'
      ? {
          success: true,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER,
          reset: Date.now(),
        }
      : checkRateLimit(rateLimitKey, {
          limit: 5,
          windowMs: 60 * 60 * 1000,
        });
    baseHeaders = createRateLimitHeaders(rateLimitResult);
    const respond = (body: unknown, status = 200, headers?: Headers) =>
      NextResponse.json(body, { status, headers: headers ?? baseHeaders });

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      const headers = createRateLimitHeaders(rateLimitResult, retryAfterSeconds);
      return respond(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfterSeconds,
        },
        429,
        headers
      );
    }

    if (!userId) {
      return respond(
        { error: 'Unauthorized. Please log in to create question sets.' },
        401
      );
    }
    const authenticatedUserId = userId;

    const formData = await request.formData();

    // Extract form data
    const targetWordsRaw = formData.get('targetWords') as string | null;
    const targetWords = targetWordsRaw
      ? targetWordsRaw.split(',').map(w => w.trim()).filter(Boolean)
      : undefined;

    const distributionRaw = formData.get('distribution') as string | null;
    let customDistribution = null;
    if (distributionRaw) {
      try {
        customDistribution = JSON.parse(distributionRaw);
      } catch (error) {
        logger.warn({ error }, 'Failed to parse custom distribution');
      }
    }

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

    const generationMode = (formData.get('generationMode') as string) || 'quiz';
    const orchestrateRaw = (formData.get('orchestrate') as string | null)?.toLowerCase();
    const orchestrate = orchestrateRaw !== 'false' && orchestrateRaw !== '0';
    const bypassCapacityCheckRaw = (formData.get('bypassCapacityCheck') as string | null)?.toLowerCase();
    const bypassCapacityCheck = bypassCapacityCheckRaw === 'true' || bypassCapacityCheckRaw === '1';
    const capacityCheckOnlyRaw = (formData.get('capacityCheckOnly') as string | null)?.toLowerCase();
    const capacityCheckOnly = capacityCheckOnlyRaw === 'true' || capacityCheckOnlyRaw === '1';

    // Validate generation mode
    if (!['quiz', 'flashcard', 'both'].includes(generationMode)) {
      return respond(
        { error: 'Invalid generation mode. Must be "quiz", "flashcard", or "both"' },
        400
      );
    }

    // Validate input with Zod schema
    const validationResult = createQuestionSetSchema.safeParse(rawData);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return respond(
        { error: 'Validation failed', details: errors },
        400
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

    let requestedQuestionCount = 0;
    if (generationMode === 'quiz' || generationMode === 'both') {
      requestedQuestionCount += questionCount * 2;
    }
    if (generationMode === 'flashcard' || generationMode === 'both') {
      requestedQuestionCount += questionCount;
    }

    // Process uploaded files with validation
    // Note: Vercel Hobby tier has 5MB request body limit
    // Reduced limits to work within this constraint (1 file × 5MB + overhead)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
    const MAX_FILES = 1; // Max 1 file to stay under 5MB total request limit
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
      return respond(
        {
          error: `Maximum ${MAX_FILES} file allowed. This limit ensures requests stay under the 5MB total size limit.`,
          details: 'For larger uploads, consider splitting materials or using text input instead of files.'
        },
        400
      );
    }

    // Estimate total request size to prevent "Request Entity Too Large" errors
    let totalSize = (materialText?.length || 0);
    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        totalSize += value.size;
      }
    }

    // Vercel Hobby tier has 5MB request limit
    const MAX_TOTAL_SIZE = 5 * 1024 * 1024; // 5MB
    if (totalSize > MAX_TOTAL_SIZE) {
      return respond(
        {
          error: `Total request size (${Math.round(totalSize / 1024 / 1024 * 10) / 10}MB) exceeds the 5MB limit.`,
          details: 'Please reduce file sizes, use fewer files, or shorten the text material.'
        },
        413
      );
    }

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          return respond(
            { error: `File "${value.name}" exceeds 5MB limit. Please use a smaller file.` },
            400
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
          return respond(
            {
              error: `File "${value.name}" has invalid type. Allowed: PDF, images (JPEG, PNG, GIF, WebP), or text files.`,
            },
            400
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
      return respond(
        { error: 'Please provide material (text or files)' },
        400
      );
    }

    // Material sufficiency analysis before generation.
    if (materialText && !bypassCapacityCheck) {
      const capacity = analyzeMaterialCapacity(materialText);
      const questionCountValidation = validateQuestionCount(questionCount, capacity);

      if (questionCountValidation.status === 'risky' || questionCountValidation.status === 'excessive') {
        return respond({
          warningRequired: true,
          capacity,
          validation: questionCountValidation,
          message: `Materiaali tukee optimaalisesti ${capacity.optimalQuestionCount} kysymystä, mutta pyysit ${questionCount}.`,
        });
      }

      if (capacityCheckOnly) {
        return respond({
          warningRequired: false,
          capacity,
          validation: questionCountValidation,
        });
      }
    } else if (capacityCheckOnly) {
      return respond({ warningRequired: false });
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
        identifiedTopics: getSimpleTopics(topicAnalysis),
        topicCount: getSimpleTopics(topicAnalysis).length,
      },
      'Topics identified successfully'
    );

    // Flashcard question count uses requested questionCount (same as quiz pool size)
    const flashcardQuestionCount = questionCount;

    logger.info(
      {
        topicCount: getSimpleTopics(topicAnalysis).length,
        totalFlashcards: flashcardQuestionCount,
        orchestrate,
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
      promptMetadata?: PromptMetadata;
      difficulty?: Difficulty;
      mode: 'quiz' | 'flashcard';
    }>[] = [];

    // Track metadata for error reporting in case of failures
    const generationTasksMetadata: Array<{
      mode: 'quiz' | 'flashcard';
      difficulty?: Difficulty;
    }> = [];

    // Add quiz generation tasks
    if (generationMode === 'quiz' || generationMode === 'both') {
      for (const difficulty of difficulties) {
        let promptMetadata: PromptMetadata | undefined;
        generationTasks.push(
          generateQuestions({
            subject,
            subjectType,
            difficulty,
            questionCount: questionCount, // Use pool size (40-400), not session length
            grade,
            topic,
            subtopic,
            materialText,
            materialFiles: files.length > 0 ? files : undefined,
            mode: 'quiz',
            identifiedTopics: getSimpleTopics(topicAnalysis), // Pass identified topics
            targetWords: validatedTargetWords,
            distribution: customDistribution, // Pass user's confirmed distribution
            metricsContext: {
              userId: authenticatedUserId,
            },
            onPromptMetadata: (metadata) => {
              promptMetadata = metadata;
            },
          }).then((questions) => ({
            questions,
            promptMetadata,
            difficulty,
            mode: 'quiz' as const,
          }))
        );

        // Track metadata for error reporting
        generationTasksMetadata.push({ mode: 'quiz', difficulty });
      }
    }

    // Add flashcard generation task
    if (generationMode === 'flashcard' || generationMode === 'both') {
      let promptMetadata: PromptMetadata | undefined;
      generationTasks.push(
        generateQuestions({
          subject,
          subjectType,
          difficulty: 'normaali', // Flashcards use normaali as placeholder
            questionCount: flashcardQuestionCount,
          grade,
          topic,
          subtopic,
          materialText,
          materialFiles: files.length > 0 ? files : undefined,
          mode: 'flashcard',
          identifiedTopics: getSimpleTopics(topicAnalysis), // Pass identified topics
          targetWords: validatedTargetWords,
          distribution: customDistribution, // Pass user's confirmed distribution
          metricsContext: {
            userId: authenticatedUserId,
          },
          onPromptMetadata: (metadata) => {
            promptMetadata = metadata;
          },
        }).then((questions) => ({
          questions,
          promptMetadata,
          mode: 'flashcard' as const,
        }))
      );

      // Track metadata for error reporting
      generationTasksMetadata.push({ mode: 'flashcard' });
    }

    // Execute all generation tasks in parallel with partial success handling
    const settledResults = await Promise.allSettled(generationTasks);

    // Process settled results - separate successes from failures
    const successfulResults: Array<{
      questions: any[];
      promptMetadata?: PromptMetadata;
      difficulty?: Difficulty;
      mode: 'quiz' | 'flashcard';
    }> = [];

    const failedResults: Array<{
      mode: 'quiz' | 'flashcard';
      difficulty?: Difficulty;
      error: string;
      errorType?: 'generation' | 'validation' | 'timeout';
    }> = [];

    settledResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successfulResults.push(result.value);

        logger.info(
          {
            mode: result.value.mode,
            difficulty: result.value.difficulty,
            questionCount: result.value.questions.length,
          },
          'Question generation succeeded'
        );
      } else {
        // Extract mode and difficulty from original task metadata
        const error = result.reason instanceof Error ? result.reason : new Error(String(result.reason));
        const errorMessage = error.message;

        // Determine error type for better client handling
        let errorType: 'generation' | 'validation' | 'timeout' = 'generation';
        if (errorMessage.toLowerCase().includes('timeout')) {
          errorType = 'timeout';
        } else if (errorMessage.toLowerCase().includes('validation')) {
          errorType = 'validation';
        }

        const taskMetadata = generationTasksMetadata[index];

        failedResults.push({
          mode: taskMetadata.mode,
          difficulty: taskMetadata.difficulty,
          error: errorMessage,
          errorType,
        });

        logger.error(
          {
            mode: taskMetadata.mode,
            difficulty: taskMetadata.difficulty,
            error: errorMessage,
            errorType,
          },
          'Question generation failed'
        );
      }
    });

    logger.info(
      {
        successCount: successfulResults.length,
        failureCount: failedResults.length,
        totalRequested: settledResults.length,
      },
      'Question generation batch completed'
    );

    // STEP 3: Create question sets in database (only for successful generations)
    logger.info(
      {
        successfulSets: successfulResults.length,
        failedSets: failedResults.length,
      },
      'Step 3: Saving successful question sets to database'
    );
    const createdSets: any[] = [];
    const dbFailures: Array<{
      mode: 'quiz' | 'flashcard';
      difficulty?: Difficulty;
      error: string;
    }> = [];

    for (const result of successfulResults) {
      const { questions, promptMetadata, difficulty, mode } = result;
      const orchestratedQuestions: Question[] =
        mode === 'quiz' && orchestrate
          ? orchestrateQuestionSet(questions as Question[], { expectedDifficulty: difficulty })
          : (questions as Question[]);
      const dependencyResult = dependencyResolver.reorderQuestionsByDependencies(
        subject,
        orchestratedQuestions,
        { grade }
      );
      const questionsForSave = dependencyResult.reorderedQuestions as Question[];

      logger.info(
        {
          mode,
          difficulty,
          changedOrder: dependencyResult.changed,
          dependencyValid: dependencyResult.validation.valid,
          violationsCaught: dependencyResult.validation.violations.length,
        },
        'Concept dependency validation completed'
      );

      if (!dependencyResult.validation.valid) {
        logger.warn(
          {
            mode,
            difficulty,
            violations: dependencyResult.validation.violations.slice(0, 10),
          },
          'Dependency violations were detected in generated questions'
        );
      }

      if (mode === 'quiz') {
        const quality = analyzeQuestionSetQuality(questionsForSave);
        logger.info(
          {
            difficulty,
            orchestrated: orchestrate,
            quality,
          },
          'Question ordering quality metrics'
        );
      }

      if (questionsForSave.length === 0) {
        logger.warn({ mode, difficulty }, 'Skipping empty question set');
        dbFailures.push({
          mode,
          difficulty,
          error: 'No questions generated',
        });
        continue;
      }

      try {
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
              subject_type: subjectType,
              question_count: questionsForSave.length,
              exam_length: examLength,
              status: 'created',  // New question sets default to unpublished
              prompt_metadata: promptMetadata,
            },
            questionsForSave
          );

          if (!dbResult) {
            attempts++;
            code = generateCode();

            if (attempts % 10 === 0) {
              logger.warn({ attempts, mode, difficulty }, 'Code collision detected');
            }
          }
        }

        if (!dbResult) {
          logger.error({ maxAttempts, mode, difficulty }, 'Failed to generate unique code');
          dbFailures.push({
            mode,
            difficulty,
            error: 'Failed to generate unique code after 50 attempts',
          });
          continue;
        }

        createdSets.push(dbResult);

        logger.info(
          {
            code: dbResult.code,
            mode,
            difficulty,
            questionCount: questionsForSave.length,
          },
          'Question set saved successfully'
        );
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);

        logger.error(
          {
            mode,
            difficulty,
            error: errorMessage,
          },
          'Failed to save question set to database'
        );

        dbFailures.push({
          mode,
          difficulty,
          error: `Database error: ${errorMessage}`,
        });
      }
    }

    // Merge generation failures and database failures
    const allFailures = [
      ...failedResults,
      ...dbFailures.map(f => ({ ...f, errorType: 'database' as const })),
    ];

    // Determine overall success status
    const hasSuccess = createdSets.length > 0;
    const hasFailures = allFailures.length > 0;
    const isPartialSuccess = hasSuccess && hasFailures;

    // Build response
    const response = {
      success: hasSuccess, // true if ANY sets were created
      partial: isPartialSuccess, // true if some succeeded and some failed
      message: hasSuccess
        ? isPartialSuccess
          ? `Created ${createdSets.length} of ${settledResults.length} question sets (${allFailures.length} failed)`
          : `Successfully created ${createdSets.length} question sets`
        : `Failed to create question sets (${allFailures.length} errors)`,
      questionSets: createdSets.map(set => ({
        code: set.code,
        name: set.questionSet.name,
        difficulty: set.questionSet.difficulty,
        mode: set.questionSet.mode,
        questionCount: set.questionSet.question_count,
      })),
      failures: hasFailures ? allFailures : undefined,
      totalQuestions: createdSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
      stats: {
        requested: settledResults.length,
        succeeded: createdSets.length,
        failed: allFailures.length,
      },
    };

    // Use 200 for partial success (user got something useful)
    // Use 500 only for total failure (nothing created)
    const httpStatus = hasSuccess ? 200 : 500;

    logger.info(
      {
        questionSetsCreated: createdSets.length,
        failuresCount: allFailures.length,
        totalQuestions: response.totalQuestions,
        isPartialSuccess,
        httpStatus,
      },
      'Request completed'
    );

    return respond(response, httpStatus);
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
      { status: 500, headers: baseHeaders ?? new Headers() }
    );
  }
}
