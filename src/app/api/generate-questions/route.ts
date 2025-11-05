import { NextRequest, NextResponse } from 'next/server';
import { fileTypeFromBuffer } from 'file-type';
import crypto from 'crypto';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty } from '@/types';
import { createQuestionSetSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-questions' });

  logger.info({ method: 'POST' }, 'Request received');

  try {
    const formData = await request.formData();

    // Extract form data
    const rawData = {
      subject: formData.get('subject') as string,
      questionCount: parseInt(formData.get('questionCount') as string),
      questionSetName: formData.get('questionSetName') as string,
      grade: formData.get('grade') ? parseInt(formData.get('grade') as string) : undefined,
      topic: (formData.get('topic') as string | null) || undefined,
      subtopic: (formData.get('subtopic') as string | null) || undefined,
      materialText: (formData.get('materialText') as string | null) || undefined,
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

    const { subject, questionCount, questionSetName, grade, topic, subtopic, materialText } = validationResult.data;

    // Process uploaded files with validation
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_FILES = 5;
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
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    for (const [, value] of fileEntries) {
      if (value instanceof File) {
        // Validate file size
        if (value.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `File "${value.name}" exceeds 5MB limit` },
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

    // Define all difficulty levels
    const difficulties: Difficulty[] = ['helppo', 'normaali', 'vaikea', 'mahdoton'];

    // Calculate questions per difficulty (25% each)
    const questionsPerDifficulty = Math.floor(questionCount / 4);

    // Array to store created question sets
    const createdSets: any[] = [];

    // Generate questions for each difficulty level
    for (const difficulty of difficulties) {
      // Generate questions using AI
      const questions = await generateQuestions({
        subject,
        difficulty,
        questionCount: questionsPerDifficulty,
        grade,
        materialText,
        materialFiles: files.length > 0 ? files : undefined,
      });

      if (questions.length === 0) {
        return NextResponse.json(
          { error: `Failed to generate questions for difficulty: ${difficulty}` },
          { status: 500 }
        );
      }

      // Generate unique code with improved collision handling
      let code = generateCode();
      let attempts = 0;
      const maxAttempts = 50; // Increased from 10 to 50
      let result = null;

      // Ensure code is unique (retry with exponential backoff logging)
      while (attempts < maxAttempts && !result) {
        result = await createQuestionSet(
          {
            code,
            name: `${questionSetName} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
            subject: subject as Subject,
            difficulty,
            grade,
            topic,
            subtopic,
            question_count: questions.length,
          },
          questions
        );

        if (!result) {
          // Code collision detected
          attempts++;
          code = generateCode();

          // Log collision for monitoring (only log every 10 attempts to avoid spam)
          if (attempts % 10 === 0) {
            console.warn(`Code collision detected: ${attempts} attempts for difficulty ${difficulty}`);
          }

          // If we're getting many collisions, alert in logs
          if (attempts > 30) {
            console.error(`High collision rate detected: ${attempts} attempts. Consider increasing code length.`);
          }
        }
      }

      if (!result) {
        console.error(`Failed to generate unique code after ${maxAttempts} attempts for difficulty: ${difficulty}`);
        return NextResponse.json(
          { error: `Failed to create question set. Please try again.` },
          { status: 500 }
        );
      }

      createdSets.push(result);
    }

    const response = {
      success: true,
      message: `Created ${createdSets.length} question sets across all difficulty levels`,
      questionSets: createdSets.map(set => ({
        code: set.code,
        difficulty: set.questionSet.difficulty,
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
