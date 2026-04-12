import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createLogger } from '@/lib/logger';
import { getApiKeyForSchool, MISSING_API_KEY_MESSAGE } from '@/lib/ai/getApiKeyForSchool';
import { getSchoolForUser } from '@/lib/auth/roles';
import {
  generateFlashcardSet,
  generateQuizSets,
  identifyTopicsFromMaterial,
  processUploadedFiles,
  type FlashcardGenerationRequest,
  type MaterialFile,
  type QuestionGenerationOptions,
  type QuizGenerationRequest,
} from '@/lib/api/questionGeneration';
import type { EnhancedTopic } from '@/lib/ai/topicIdentifier';
import { getSimpleTopics } from '@/lib/ai/topicIdentifier';
import { parseRequestedProvider, validateRequestedProvider } from '@/lib/api/modelSelection';
import { requireAuth, resolveAuthError } from '@/lib/supabase/server-auth';
import { getDefaultFlashcardContentType, isLanguageSubject } from '@/lib/utils/subjectClassification';
import type { Difficulty } from '@/types';
import type { TopicDistribution } from '@/lib/utils/questionDistribution';

export const maxDuration = 60;

const difficultySchema = z.enum(['helppo', 'normaali']);
const enhancedTopicSchema: z.ZodType<EnhancedTopic> = z.object({
  name: z.string().min(1),
  coverage: z.number(),
  difficulty: difficultySchema,
  keywords: z.array(z.string()),
  subtopics: z.array(z.string()),
  importance: z.enum(['high', 'medium', 'low']),
  questionCapacity: z.number().int().positive().optional(),
  flashcardCapacity: z.number().int().positive().optional(),
});

const topicDistributionSchema: z.ZodType<TopicDistribution> = z.object({
  topic: z.string().min(1),
  targetCount: z.number().int(),
  coverage: z.number(),
  keywords: z.array(z.string()),
  subtopics: z.array(z.string()),
  difficulty: z.string(),
  importance: z.string(),
  questionCapacity: z.number().int().positive().optional(),
  flashcardCapacity: z.number().int().positive().optional(),
});

const generateSingleRequestSchema = z.object({
  type: z.enum(['quiz', 'flashcard']),
  difficulty: difficultySchema.optional(),
  subject: z.string().trim().min(1),
  subjectType: z.enum(['language', 'math', 'written', 'skills', 'concepts', 'geography']).optional(),
  grade: z.coerce.number().int().min(1).max(13).optional(),
  questionCount: z.coerce.number().int().min(1).max(20),
  examLength: z.coerce.number().int().min(1).max(20).optional(),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  questionSetName: z.string().trim().min(1).max(200).optional(),
  topic: z.string().trim().max(200).optional(),
  subtopic: z.string().trim().max(200).optional(),
  material: z.string().max(50000).optional(),
  materialText: z.string().max(50000).optional(),
  targetWords: z.array(z.string().trim().min(1)).max(100).optional(),
  topics: z.array(enhancedTopicSchema).optional(),
  focusTopic: enhancedTopicSchema.optional(),
  identifiedTopics: z.array(z.string().trim().min(1)).optional(),
  distribution: z.array(topicDistributionSchema).optional(),
  contentType: z.enum(['vocabulary', 'grammar', 'mixed']).optional(),
  provider: z.string().optional(),
  schoolId: z.string().uuid().optional(),
  orchestrate: z.boolean().optional(),
});

function parseJsonField<T>(value: FormDataEntryValue | null): T | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

async function parseRequestPayload(request: NextRequest): Promise<{
  payload: z.infer<typeof generateSingleRequestSchema>;
  files: MaterialFile[];
}> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const validationResult = generateSingleRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw validationResult.error;
    }

    return {
      payload: validationResult.data,
      files: [],
    };
  }

  const formData = await request.formData();
  const { files, error } = await processUploadedFiles(formData);

  if (error) {
    throw new Error(error);
  }

  const targetWordsRaw = (formData.get('targetWords') as string | null)?.trim();
  const targetWords = targetWordsRaw
    ? targetWordsRaw
        .split(',')
        .map((word) => word.trim())
        .filter(Boolean)
    : undefined;

  const payloadCandidate = {
    type: formData.get('type'),
    difficulty: formData.get('difficulty') ?? undefined,
    subject: formData.get('subject'),
    subjectType: formData.get('subjectType') ?? undefined,
    grade: formData.get('grade') ?? undefined,
    questionCount: formData.get('questionCount'),
    examLength: formData.get('examLength') ?? undefined,
    examDate: formData.get('examDate') ?? undefined,
    questionSetName: formData.get('questionSetName') ?? undefined,
    topic: formData.get('topic') ?? undefined,
    subtopic: formData.get('subtopic') ?? undefined,
    materialText: formData.get('materialText') ?? undefined,
    targetWords,
    topics: parseJsonField<EnhancedTopic[]>(formData.get('topics')),
    focusTopic: parseJsonField<EnhancedTopic>(formData.get('focusTopic')),
    identifiedTopics: parseJsonField<string[]>(formData.get('identifiedTopics')),
    distribution: parseJsonField<TopicDistribution[]>(formData.get('distribution')),
    contentType: formData.get('contentType') ?? undefined,
    provider: formData.get('provider') ?? undefined,
    schoolId: formData.get('schoolId') ?? undefined,
    orchestrate: (() => {
      const raw = (formData.get('orchestrate') as string | null)?.toLowerCase();
      if (!raw) return undefined;
      return raw === 'true' || raw === '1';
    })(),
  };

  const validationResult = generateSingleRequestSchema.safeParse(payloadCandidate);
  if (!validationResult.success) {
    throw validationResult.error;
  }

  return {
    payload: validationResult.data,
    files,
  };
}

function buildDefaultQuestionSetName(params: {
  subject: string;
  type: 'quiz' | 'flashcard';
  difficulty?: Difficulty;
}): string {
  if (params.type === 'flashcard') {
    return `${params.subject} - Muistikortit`;
  }

  const label = params.difficulty === 'helppo' ? 'Helppo' : 'Normaali';
  return `${params.subject} - ${label}`;
}

async function resolveSchoolId(userId: string, request: NextRequest, bodySchoolId?: string): Promise<string> {
  const requestedSchoolId = request.headers.get('x-school-id')?.trim() || bodySchoolId;
  const membership = await getSchoolForUser(userId, requestedSchoolId || undefined);

  if (!membership) {
    throw new Error('Tiliäsi ei ole liitetty kouluun.');
  }

  return membership.school_id;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = createLogger({ requestId, route: '/api/generate-single' });

  logger.info({ method: 'POST' }, 'Single generation request received');

    try {
      let userId = '';
      try {
        const user = await requireAuth(request);
        userId = user.id;
        logger.info({ userId }, 'Authenticated generation request');
      } catch (authError) {
        const { message } = resolveAuthError(authError, {
          unauthorized: 'Unauthorized. Please log in to generate questions.',
          forbidden: 'Forbidden.',
        });

      logger.warn({ error: message }, 'Authentication failed');
      return NextResponse.json({ error: message }, { status: 403 });
    }

    try {
      const { payload, files } = await parseRequestPayload(request);
      const questionCount = payload.questionCount;

      if (questionCount > 20) {
        return NextResponse.json(
          { error: 'questionCount cannot exceed 20' },
          { status: 400 }
        );
      }

      const targetProvider = parseRequestedProvider(payload.provider ?? null);
      if (targetProvider) {
        const modelValidationError = validateRequestedProvider(targetProvider);
        if (modelValidationError) {
          return NextResponse.json({ error: modelValidationError }, { status: 400 });
        }
      }

      const schoolId = await resolveSchoolId(userId, request, payload.schoolId);
      const provider = targetProvider ?? 'anthropic';
      const apiKey = await getApiKeyForSchool(schoolId, provider);

      let topicAnalysis:
        | Awaited<ReturnType<typeof identifyTopicsFromMaterial>>
        | undefined;
      let enhancedTopics = payload.topics;
      let simpleTopics = payload.identifiedTopics;

      if (!enhancedTopics || enhancedTopics.length === 0) {
        topicAnalysis = await identifyTopicsFromMaterial({
          subject: payload.subject,
          grade: payload.grade,
          materialText: payload.materialText ?? payload.material,
          materialFiles: files.length > 0 ? files : undefined,
          targetProvider,
          apiKey,
        });
        enhancedTopics = topicAnalysis.topics;
        simpleTopics = getSimpleTopics(topicAnalysis);
      } else if (!simpleTopics || simpleTopics.length === 0) {
        simpleTopics = enhancedTopics.map((topic) => topic.name);
      }

      const topicsForGeneration = payload.focusTopic ? [payload.focusTopic] : enhancedTopics;
      const identifiedTopicsForGeneration = payload.focusTopic
        ? [payload.focusTopic.name]
        : simpleTopics;
      const distributionForGeneration = payload.focusTopic
        ? [{
            topic: payload.focusTopic.name,
            targetCount: questionCount,
            coverage: 1,
            keywords: payload.focusTopic.keywords,
            subtopics: payload.focusTopic.subtopics,
            difficulty: payload.focusTopic.difficulty,
            importance: payload.focusTopic.importance,
            questionCapacity: payload.focusTopic.questionCapacity,
            flashcardCapacity: payload.focusTopic.flashcardCapacity,
          }]
        : payload.distribution;
      const topicForGeneration = payload.focusTopic?.name ?? payload.topic;
      const subtopicForGeneration = payload.focusTopic && payload.focusTopic.subtopics.length === 1
        ? payload.focusTopic.subtopics[0]
        : payload.subtopic;

      const baseRequest = {
        userId,
        schoolId,
        apiKey,
        subject: payload.subject,
        subjectType: payload.subjectType,
        grade: payload.grade,
        questionCount,
        examLength: payload.examLength ?? questionCount,
        examDate: payload.examDate,
        questionSetName: payload.questionSetName ?? buildDefaultQuestionSetName({
          subject: payload.subject,
          type: payload.type,
          difficulty: payload.difficulty,
        }),
        topic: topicForGeneration,
        focusTopic: payload.focusTopic?.name, // AIDEV-FOCUS-BATCH-CHAIN
        subtopic: subtopicForGeneration,
        materialText: payload.materialText ?? payload.material,
        materialFiles: files.length > 0 ? files : undefined,
        targetWords: payload.targetWords,
        identifiedTopics: identifiedTopicsForGeneration,
        distribution: distributionForGeneration,
        targetProvider,
      };

      logger.info(
        {
          type: payload.type,
          difficulty: payload.difficulty,
          subject: payload.subject,
          questionCount,
          hasMaterial: Boolean(baseRequest.materialText),
          fileCount: files.length,
          topicCount: topicsForGeneration?.length ?? 0,
          focusTopic: payload.focusTopic?.name,
          schoolId,
          provider,
        },
        'Starting single-step generation'
      );

      if (payload.type === 'quiz') {
        const quizRequest: QuizGenerationRequest = {
          ...baseRequest,
          difficulties: payload.difficulty ? [payload.difficulty] : ['normaali'],
        };
        const options: QuestionGenerationOptions = { orchestrate: payload.orchestrate };
        const quizSets = await generateQuizSets(quizRequest, topicsForGeneration, options);

        logger.info(
          {
            setsCreated: quizSets.length,
            codes: quizSets.map((set) => set.code),
          },
          'Quiz generation completed successfully'
        );

        return NextResponse.json({
          success: true,
          questionSets: quizSets.map((set) => ({
            id: set.questionSet.id,
            code: set.code,
            name: set.questionSet.name,
            difficulty: set.questionSet.difficulty,
            mode: set.questionSet.mode,
            questionCount: set.questionSet.question_count,
          })),
          totalQuestions: quizSets.reduce((sum, set) => sum + set.questionSet.question_count, 0),
        });
      }

      const resolvedContentType =
        payload.contentType
        ?? getDefaultFlashcardContentType(payload.subject, payload.subjectType);
      const languageSubject = isLanguageSubject(payload.subject, payload.subjectType);

      if (languageSubject && resolvedContentType === 'vocabulary') {
        return NextResponse.json(
          {
            error: 'Vocabulary flashcards not supported for language subjects',
            message: 'Sanasto-flashcardeja ei tueta kieliaineille. Käytä kielioppi-flashcardeja tai quiz-muotoa sanastolle.',
            suggestion: {
              useQuizForVocabulary: 'Luo quiz-muotoinen kysymyssarja sanastosta (monivalintakysymykset toimivat paremmin)',
              useGrammarForFlashcards: 'Käytä flashcardeja kielioppisääntöjen opetteluun (contentType: \'grammar\')',
            },
            allowedContentTypes: ['grammar', 'mixed'],
            rejectedContentType: 'vocabulary',
          },
          { status: 400 }
        );
      }

      const flashcardRequest: FlashcardGenerationRequest = {
        ...baseRequest,
        contentType: resolvedContentType,
      };
      const flashcardSet = await generateFlashcardSet(flashcardRequest, topicsForGeneration);

      logger.info(
        {
          code: flashcardSet.code,
          questionCount: flashcardSet.questionSet.question_count,
        },
        'Flashcard generation completed successfully'
      );

      return NextResponse.json({
        success: true,
        questionSet: {
          id: flashcardSet.questionSet.id,
          code: flashcardSet.code,
          name: flashcardSet.questionSet.name,
          mode: flashcardSet.questionSet.mode,
          questionCount: flashcardSet.questionSet.question_count,
        },
      });
    } catch (parseError) {
      if (parseError instanceof z.ZodError) {
        const details = parseError.errors.map((error) => `${error.path.join('.')}: ${error.message}`);
        logger.warn({ details }, 'Single generation request validation failed');
        return NextResponse.json({ error: 'Validation failed', details }, { status: 400 });
      }

      if (parseError instanceof Error && parseError.message) {
        logger.warn({ error: parseError.message }, 'Single generation request rejected');
        return NextResponse.json({ error: parseError.message }, { status: 400 });
      }

      logger.warn({ parseError }, 'Single generation request body invalid');
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error && error.message === MISSING_API_KEY_MESSAGE) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message === 'Tiliäsi ei ole liitetty kouluun.') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    logger.error(
      {
        err: error,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      'Single generation failed'
    );

    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === 'production'
            ? 'Failed to generate questions. Please try again later.'
            : error instanceof Error
              ? error.message
              : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
