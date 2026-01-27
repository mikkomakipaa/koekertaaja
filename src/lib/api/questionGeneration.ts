/**
 * Shared Question Generation Utilities
 *
 * Contains reusable logic for quiz and flashcard generation across
 * different API endpoints.
 */

import { fileTypeFromBuffer } from 'file-type';
import { generateQuestions } from '@/lib/ai/questionGenerator';
import { identifyTopics, getSimpleTopics, type EnhancedTopic } from '@/lib/ai/topicIdentifier';
import { createQuestionSet } from '@/lib/supabase/write-queries';
import { generateCode } from '@/lib/utils';
import { Subject, Difficulty, QuestionSet } from '@/types';
import { createLogger } from '@/lib/logger';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import { calculateDistribution, formatDistributionForPrompt } from '@/lib/utils/questionDistribution';
import { validateCoverage, formatCoverageReport } from '@/lib/utils/coverageValidation';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MaterialFile {
  type: string;
  name: string;
  data: string; // base64 encoded
}

export interface GenerationRequest {
  subject: string;
  subjectType?: string;
  grade?: number;
  questionCount: number;
  examLength: number;
  questionSetName: string;
  topic?: string;
  subtopic?: string;
  materialText?: string;
  materialFiles?: MaterialFile[];
  targetWords?: string[];
  identifiedTopics?: string[]; // Pre-computed topics (optional)
}

export interface QuizGenerationRequest extends GenerationRequest {
  difficulties: Difficulty[]; // ['helppo', 'normaali']
}

export interface FlashcardGenerationRequest extends GenerationRequest {
  // Flashcard-specific options can be added here
}

// Return type matches createQuestionSet exactly
export type QuestionSetResult = {
  code: string;
  questionSet: QuestionSet;
};

// ============================================================================
// File Processing Utilities
// ============================================================================

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_FILES = 1; // Max 1 file
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
];

export async function processUploadedFiles(
  formData: FormData
): Promise<{ files: MaterialFile[]; error?: string }> {
  const files: MaterialFile[] = [];
  const fileEntries = Array.from(formData.entries()).filter(([key]) =>
    key.startsWith('file_')
  );

  // Validate file count
  if (fileEntries.length > MAX_FILES) {
    return {
      files: [],
      error: `Maximum ${MAX_FILES} file allowed. This limit ensures requests stay under the 5MB total size limit.`,
    };
  }

  for (const [, value] of fileEntries) {
    if (value instanceof File) {
      // Validate file size
      if (value.size > MAX_FILE_SIZE) {
        return {
          files: [],
          error: `File "${value.name}" exceeds 5MB limit. Please use a smaller file.`,
        };
      }

      const arrayBuffer = await value.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate file type using magic bytes
      const detectedType = await fileTypeFromBuffer(buffer);

      // For text files, fileTypeFromBuffer returns undefined
      const isTextFile = value.type.startsWith('text/') && !detectedType;

      if (!isTextFile && (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime))) {
        return {
          files: [],
          error: `File "${value.name}" has invalid type. Allowed: PDF, images (JPEG, PNG, GIF, WebP), or text files.`,
        };
      }

      const base64 = buffer.toString('base64');
      files.push({
        type: detectedType?.mime || 'text/plain',
        name: value.name,
        data: base64,
      });
    }
  }

  return { files };
}

// ============================================================================
// Topic Identification
// ============================================================================

/**
 * Identify topics from material (shared step across quiz and flashcard generation)
 * Returns full enhanced topic analysis for intelligent distribution
 */
export async function identifyTopicsFromMaterial(
  request: Pick<GenerationRequest, 'subject' | 'grade' | 'materialText' | 'materialFiles'>
): Promise<import('@/lib/ai/topicIdentifier').TopicAnalysisResult> {
  const logger = createLogger({ module: 'identifyTopicsFromMaterial' });

  logger.info(
    {
      subject: request.subject,
      grade: request.grade,
      hasText: !!request.materialText,
      fileCount: request.materialFiles?.length || 0,
    },
    'Identifying topics from material'
  );

  const topicAnalysis = await identifyTopics({
    subject: request.subject,
    grade: request.grade,
    materialText: request.materialText,
    materialFiles: request.materialFiles,
  });

  logger.info(
    {
      enhancedTopics: topicAnalysis.topics.map(t => ({
        name: t.name,
        coverage: t.coverage,
        keywordCount: t.keywords.length,
        subtopicCount: t.subtopics.length,
        difficulty: t.difficulty,
        importance: t.importance,
      })),
      topicCount: topicAnalysis.topics.length,
      metadata: topicAnalysis.metadata,
    },
    'Enhanced topics identified successfully'
  );

  // Return full enhanced data for distribution logic
  return topicAnalysis;
}

// ============================================================================
// Quiz Generation
// ============================================================================

/**
 * Generate quiz question sets (multiple difficulties)
 * Returns array of created quiz sets with full question data
 */
export async function generateQuizSets(
  request: QuizGenerationRequest,
  enhancedTopics?: EnhancedTopic[]
): Promise<QuestionSetResult[]> {
  const logger = createLogger({ module: 'generateQuizSets' });
  const results: QuestionSetResult[] = [];

  // Calculate distribution if enhanced topics provided
  let distribution;
  if (enhancedTopics && enhancedTopics.length > 0) {
    distribution = calculateDistribution(enhancedTopics, request.questionCount);

    logger.info(
      {
        distribution: distribution.map(d => ({
          topic: d.topic,
          count: d.targetCount,
          percentage: Math.round(d.coverage * 100),
        })),
      },
      'Using intelligent distribution from coverage data'
    );
  }

  logger.info(
    {
      subject: request.subject,
      difficulties: request.difficulties,
      questionCount: request.questionCount,
      hasTopics: !!request.identifiedTopics,
      hasEnhancedTopics: !!enhancedTopics,
      useDistribution: !!distribution,
    },
    'Starting quiz generation for all difficulties'
  );

  for (const difficulty of request.difficulties) {
    logger.info({ difficulty }, `Generating quiz questions for difficulty`);

    const questions = await generateQuestions({
      subject: request.subject,
      subjectType: request.subjectType as SubjectType | undefined,
      difficulty,
      questionCount: request.questionCount,
      grade: request.grade,
      topic: request.topic,
      subtopic: request.subtopic,
      materialText: request.materialText,
      materialFiles: request.materialFiles,
      mode: 'quiz',
      identifiedTopics: request.identifiedTopics,
      targetWords: request.targetWords,
      enhancedTopics, // NEW: Pass enhanced topics
      distribution, // NEW: Pass calculated distribution
    });

    if (questions.length === 0) {
      throw new Error(`No questions generated for difficulty: ${difficulty}`);
    }

    logger.info(
      { difficulty, questionCount: questions.length },
      'Questions generated successfully'
    );

    // Validate coverage if distribution was used (Phase 3)
    if (distribution) {
      const coverageResult = validateCoverage(questions, distribution);

      logger.info(
        {
          difficulty,
          isAcceptable: coverageResult.isAcceptable,
          overallDeviation: coverageResult.overallDeviation,
          byTopic: coverageResult.coverageByTopic.map(c => ({
            topic: c.topic,
            expected: c.expectedCount,
            actual: c.actualCount,
            deviation: c.deviation,
          })),
        },
        'Coverage validation for quiz set'
      );

      // Log detailed report in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n' + formatCoverageReport(coverageResult));
      }

      // Warn if coverage is poor
      if (!coverageResult.isAcceptable) {
        logger.warn(
          {
            difficulty,
            warnings: coverageResult.warnings,
            overallDeviation: coverageResult.overallDeviation,
            threshold: Math.round(questions.length * 0.1),
          },
          'Generated questions do not meet coverage targets'
        );
      }
    }

    // Generate unique code with collision handling
    let code = generateCode();
    let attempts = 0;
    const maxAttempts = 50;
    let dbResult: QuestionSetResult | null = null;

    const setName = `${request.questionSetName} - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;

    while (attempts < maxAttempts && !dbResult) {
      dbResult = await createQuestionSet(
        {
          code,
          name: setName,
          subject: request.subject as Subject,
          difficulty,
          mode: 'quiz',
          grade: request.grade,
          topic: request.topic,
          subtopic: request.subtopic,
          subject_type: request.subjectType as any,
          question_count: questions.length,
          exam_length: request.examLength,
          status: 'created',
        },
        questions
      );

      if (!dbResult) {
        attempts++;
        code = generateCode();

        if (attempts % 10 === 0) {
          logger.warn({ attempts, difficulty }, 'Code collision detected');
        }
      }
    }

    if (!dbResult) {
      throw new Error(
        `Failed to generate unique code after ${maxAttempts} attempts for difficulty: ${difficulty}`
      );
    }

    logger.info(
      {
        code: dbResult.code,
        difficulty,
        questionCount: dbResult.questionSet.question_count,
      },
      'Quiz set saved successfully'
    );

    results.push(dbResult);
  }

  logger.info(
    { setsCreated: results.length, difficulties: request.difficulties },
    'All quiz sets generated successfully'
  );

  return results;
}

// ============================================================================
// Flashcard Generation
// ============================================================================

/**
 * Generate flashcard question set
 * Returns created flashcard set with full question data
 */
export async function generateFlashcardSet(
  request: FlashcardGenerationRequest,
  enhancedTopics?: EnhancedTopic[]
): Promise<QuestionSetResult> {
  const logger = createLogger({ module: 'generateFlashcardSet' });

  // Calculate distribution if enhanced topics provided
  let distribution;
  if (enhancedTopics && enhancedTopics.length > 0) {
    distribution = calculateDistribution(enhancedTopics, request.questionCount);

    logger.info(
      {
        distribution: distribution.map(d => ({
          topic: d.topic,
          count: d.targetCount,
          percentage: Math.round(d.coverage * 100),
        })),
      },
      'Using intelligent distribution from coverage data'
    );
  }

  logger.info(
    {
      subject: request.subject,
      questionCount: request.questionCount,
      hasTopics: !!request.identifiedTopics,
      hasEnhancedTopics: !!enhancedTopics,
      useDistribution: !!distribution,
    },
    'Starting flashcard generation'
  );

  const questions = await generateQuestions({
    subject: request.subject,
    subjectType: request.subjectType as SubjectType | undefined,
    difficulty: 'normaali', // Flashcards use normaali as placeholder
    questionCount: request.questionCount,
    grade: request.grade,
    topic: request.topic,
    subtopic: request.subtopic,
    materialText: request.materialText,
    materialFiles: request.materialFiles,
    mode: 'flashcard',
    identifiedTopics: request.identifiedTopics,
    targetWords: request.targetWords,
    enhancedTopics, // NEW: Pass enhanced topics
    distribution, // NEW: Pass calculated distribution
  });

  if (questions.length === 0) {
    throw new Error('No flashcard questions generated');
  }

  logger.info(
    { questionCount: questions.length },
    'Flashcard questions generated successfully'
  );

  // Validate coverage if distribution was used (Phase 3)
  if (distribution) {
    const coverageResult = validateCoverage(questions, distribution);

    logger.info(
      {
        isAcceptable: coverageResult.isAcceptable,
        overallDeviation: coverageResult.overallDeviation,
        byTopic: coverageResult.coverageByTopic.map(c => ({
          topic: c.topic,
          expected: c.expectedCount,
          actual: c.actualCount,
          deviation: c.deviation,
        })),
      },
      'Coverage validation for flashcard set'
    );

    // Log detailed report in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n' + formatCoverageReport(coverageResult));
    }

    // Warn if coverage is poor
    if (!coverageResult.isAcceptable) {
      logger.warn(
        {
          warnings: coverageResult.warnings,
          overallDeviation: coverageResult.overallDeviation,
          threshold: Math.round(questions.length * 0.1),
        },
        'Generated flashcard questions do not meet coverage targets'
      );
    }
  }

  // Generate unique code with collision handling
  let code = generateCode();
  let attempts = 0;
  const maxAttempts = 50;
  let dbResult: QuestionSetResult | null = null;

  const setName = `${request.questionSetName} - Kortit`;

  while (attempts < maxAttempts && !dbResult) {
    dbResult = await createQuestionSet(
      {
        code,
        name: setName,
        subject: request.subject as Subject,
        difficulty: 'normaali',
        mode: 'flashcard',
        grade: request.grade,
        topic: request.topic,
        subtopic: request.subtopic,
        subject_type: request.subjectType as any,
        question_count: questions.length,
        exam_length: request.examLength,
        status: 'created',
      },
      questions
    );

    if (!dbResult) {
      attempts++;
      code = generateCode();

      if (attempts % 10 === 0) {
        logger.warn({ attempts }, 'Code collision detected');
      }
    }
  }

  if (!dbResult) {
    throw new Error(
      `Failed to generate unique code after ${maxAttempts} attempts for flashcard set`
    );
  }

  logger.info(
    {
      code: dbResult.code,
      questionCount: dbResult.questionSet.question_count,
    },
    'Flashcard set saved successfully'
  );

  return dbResult;
}
