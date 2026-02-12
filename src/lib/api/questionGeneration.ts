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
import { Subject, Difficulty, QuestionSet, Question } from '@/types';
import { createLogger } from '@/lib/logger';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import { calculateDistribution, formatDistributionForPrompt } from '@/lib/utils/questionDistribution';
import { validateCoverage, formatCoverageReport } from '@/lib/utils/coverageValidation';
import { isRuleBasedSubject } from '@/lib/utils/subjectClassification';
import {
  calculateWeightedDifficulty,
  validateDifficultyConsistency,
} from '@/lib/utils/difficultyMapping';
import {
  analyzeQuestionSetQuality,
  orchestrateQuestionSet,
} from '@/lib/utils/questionOrdering';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';
import { storeQuestionImagesBulk } from '@/lib/storage/questionImages';
import type { AIProvider } from '@/lib/ai/providerTypes';
import {
  extractMaterialWithVisuals,
  parseImageReference,
  type ExtractedVisual,
} from '@/lib/utils/visualExtraction';
import { recommendQuestionPoolSize } from '@/lib/utils/materialAnalysis';

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
  targetProvider?: AIProvider;
}

export interface QuizGenerationRequest extends GenerationRequest {
  difficulties: Difficulty[]; // ['helppo', 'normaali']
}

export interface FlashcardGenerationRequest extends GenerationRequest {
  contentType?: 'vocabulary' | 'grammar' | 'mixed';
}

export interface QuestionGenerationOptions {
  orchestrate?: boolean;
}

// Return type matches createQuestionSet exactly
export type QuestionSetResult = {
  code: string;
  questionSet: QuestionSet;
};

export interface FlashcardDiagnostics {
  materialLength: number;
  hasGrammarKeywords: boolean;
  isGrammarSubject: boolean;
  topicProvided: boolean;
  suggestedTopic?: string;
  issues: string[];
  suggestions: string[];
}

interface FlashcardGenerationError extends Error {
  diagnostics?: FlashcardDiagnostics;
}

function applyDependencyOrdering(
  questions: Question[],
  subject: string,
  grade: number | undefined,
  logger: ReturnType<typeof createLogger>,
  context: { mode: 'quiz' | 'flashcard'; difficulty?: Difficulty }
): Question[] {
  const { reorderedQuestions, changed, validation } = dependencyResolver.reorderQuestionsByDependencies(
    subject,
    questions,
    { grade }
  );

  logger.info(
    {
      mode: context.mode,
      difficulty: context.difficulty,
      hasDependencyGraph: dependencyResolver.hasDependenciesForSubject(subject),
      changedOrder: changed,
      dependencyValid: validation.valid,
      violationsCaught: validation.violations.length,
    },
    'Concept dependency validation completed'
  );

  if (validation.violations.length > 0) {
    logger.warn(
      {
        mode: context.mode,
        difficulty: context.difficulty,
        violations: validation.violations.slice(0, 10),
      },
      'Dependency violations were detected in generated questions'
    );
  }

  return reorderedQuestions;
}

async function extractVisualsForRequest(
  request: Pick<GenerationRequest, 'materialText' | 'materialFiles'>
): Promise<ExtractedVisual[]> {
  const extracted = await extractMaterialWithVisuals({
    materialText: request.materialText,
    materialFiles: request.materialFiles,
    maxVisuals: 8,
  });
  return extracted.visuals;
}

async function attachVisualAssetsToQuestions(
  questions: Question[],
  visuals: ExtractedVisual[],
  context: { prefix: string; logger: ReturnType<typeof createLogger> }
): Promise<Question[]> {
  if (visuals.length === 0) {
    return questions;
  }

  const safePrefix = context.prefix.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();

  const uploadItems = questions
    .map((question, index) => {
      const ref = parseImageReference(question.image_reference);
      if (ref === null || !question.requires_visual) {
        return null;
      }

      const visual = visuals[ref];
      if (!visual) {
        context.logger.warn(
          {
            questionIndex: index,
            reference: question.image_reference,
            availableVisuals: visuals.length,
          },
          'Skipping visual attachment due to missing visual reference'
        );
        return null;
      }

      return {
        questionId: `${safePrefix}_${index + 1}`,
        visual,
        questionIndex: index,
      };
    })
    .filter((item): item is { questionId: string; visual: ExtractedVisual; questionIndex: number } => item !== null);

  if (uploadItems.length === 0) {
    return questions;
  }

  const urls = await storeQuestionImagesBulk(
    uploadItems.map((item) => ({ questionId: item.questionId, visual: item.visual }))
  );

  return questions.map((question, index) => {
    const uploadItem = uploadItems.find((item) => item.questionIndex === index);
    if (!uploadItem) {
      return question;
    }
    const imageUrl = urls.get(uploadItem.questionId);
    if (!imageUrl) {
      return question;
    }
    return {
      ...question,
      image_url: imageUrl,
      requires_visual: true,
    };
  });
}

/**
 * Diagnose why flashcard generation might have failed
 */
function diagnoseFlashcardFailure(
  request: FlashcardGenerationRequest,
  questionCount: number
): FlashcardDiagnostics {
  const materialLength = (request.materialText || '').length;
  const topicLower = (request.topic || '').toLowerCase();
  const subjectLower = request.subject.toLowerCase();
  const materialLower = (request.materialText || '').toLowerCase();

  const isEnglish = ['english', 'englanti'].includes(subjectLower);
  const isLanguageSubject = [
    'english',
    'englanti',
    'suomi',
    'finnish',
    'ruotsi',
    'swedish',
    'svenska',
    'äidinkieli',
  ].includes(subjectLower);

  const grammarKeywords = [
    'kielioppi',
    'grammar',
    'verbit',
    'verbs',
    'taivutus',
    'conjugation',
    'sijamuodot',
    'cases',
    'aikamuodot',
    'tenses',
  ];

  const hasGrammarKeywords = grammarKeywords.some(keyword => topicLower.includes(keyword));
  const materialMentionsGrammar = grammarKeywords.some(keyword => materialLower.includes(keyword));
  const topicProvided = Boolean(request.topic?.trim());
  const isRuleBasedByClassifier = isRuleBasedSubject(
    request.subject,
    request.topic,
    request.contentType
  );
  const isGrammarSubject =
    isLanguageSubject && (materialMentionsGrammar || hasGrammarKeywords || isRuleBasedByClassifier);

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (questionCount === 0) {
    issues.push('AI ei tuottanut yhtään kysymystä');
  }

  if (materialLength < 200) {
    issues.push(`Materiaali on liian lyhyt (${materialLength} merkkiä)`);
    suggestions.push('Lisää enemmän materiaalitekstiä (vähintään 200 merkkiä suositeltu)');
  }

  if (isLanguageSubject && materialMentionsGrammar && !hasGrammarKeywords) {
    issues.push('Materiaali sisältää kielioppisääntöjä, mutta aihe-kentässä ei ole kielioppi-avainsanoja');
    if (isEnglish) {
      suggestions.push('Lisää "Grammar rules" tai "Verbs" aihe-kenttään (Topic-kentässä)');
    } else {
      suggestions.push('Lisää "Kielioppi" tai "Verbit" aihe-kenttään');
    }
  }

  if (isLanguageSubject && !topicProvided) {
    issues.push('Aihe-kenttä on tyhjä');
    suggestions.push('Lisää aihe (esim. "Sanasto", "Kielioppi", "Verbit")');
  }

  if (materialLength > 0 && !materialLower.includes('\n') && materialLength > 500) {
    issues.push('Materiaali saattaa olla liian epäjäsenneltyä');
    suggestions.push('Jaa materiaali kappaleisiin tai lisää otsikoita');
  }

  if (isLanguageSubject && !materialMentionsGrammar) {
    suggestions.push('Kokeile "Koe"-tilaa korttien sijaan, jos materiaali on sanastopohjaista');
  }

  return {
    materialLength,
    hasGrammarKeywords,
    isGrammarSubject,
    topicProvided,
    suggestedTopic: isGrammarSubject
      ? isEnglish
        ? 'Grammar rules / Verbs'
        : 'Kielioppi / Verbit'
      : undefined,
    issues,
    suggestions,
  };
}

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
  request: Pick<GenerationRequest, 'subject' | 'grade' | 'materialText' | 'materialFiles' | 'targetProvider'>
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
    targetProvider: request.targetProvider,
  });

  topicAnalysis.metadata.recommendedQuestionPoolSize = recommendQuestionPoolSize({
    materialText: request.materialText,
    totalConcepts: topicAnalysis.metadata.totalConcepts,
    completeness: topicAnalysis.metadata.completeness,
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
  enhancedTopics?: EnhancedTopic[],
  options: QuestionGenerationOptions = { orchestrate: true }
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

  const visuals = await extractVisualsForRequest(request);
  logger.info(
    {
      visualCount: visuals.length,
    },
    'Prepared visual assets for quiz generation'
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
      visuals,
      targetProvider: request.targetProvider,
    });

    if (questions.length === 0) {
      throw new Error(`No questions generated for difficulty: ${difficulty}`);
    }

    const orchestratedQuestions = options.orchestrate !== false
      ? orchestrateQuestionSet(questions, { expectedDifficulty: difficulty })
      : questions;
    const orderedQuestions = applyDependencyOrdering(
      orchestratedQuestions,
      request.subject,
      request.grade,
      logger,
      { mode: 'quiz', difficulty }
    );
    const visualizedQuestions = await attachVisualAssetsToQuestions(orderedQuestions, visuals, {
      prefix: `${request.subject}_${difficulty}`,
      logger,
    });

    const qualityMetrics = analyzeQuestionSetQuality(orderedQuestions);
    logger.info(
      {
        difficulty,
        orchestrated: options.orchestrate !== false,
        quality: qualityMetrics,
      },
      'Question ordering quality metrics'
    );

    logger.info(
      { difficulty, questionCount: orderedQuestions.length },
      'Questions generated successfully'
    );

    // Validate coverage if distribution was used (Phase 3)
    if (distribution) {
      const coverageResult = validateCoverage(orderedQuestions, distribution);

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
        logger.debug(
          { report: formatCoverageReport(coverageResult) },
          'Coverage validation report'
        );
      }

      // Warn if coverage is poor
      if (!coverageResult.isAcceptable) {
        logger.warn(
          {
            difficulty,
            warnings: coverageResult.warnings,
            overallDeviation: coverageResult.overallDeviation,
           threshold: Math.round(orderedQuestions.length * 0.1),
          },
          'Generated questions do not meet coverage targets'
        );
      }
    }

    // Validate difficulty consistency (Phase 4)
    if (enhancedTopics && enhancedTopics.length > 0) {
      const expectedDifficulty = calculateWeightedDifficulty(
        enhancedTopics.map(t => ({
          difficulty: t.difficulty,
          coverage: t.coverage,
        }))
      );

      const difficultyResult = validateDifficultyConsistency(orderedQuestions, expectedDifficulty);

      logger.info(
        {
          difficulty,
          expectedDifficulty,
          questionTypes: Object.entries(difficultyResult.questionTypes).map(([type, pct]) => ({
            type,
            percentage: Math.round((pct as number) * 100),
          })),
          isConsistent: difficultyResult.isConsistent,
        },
        'Difficulty consistency validation for quiz set'
      );

      if (!difficultyResult.isConsistent) {
        logger.warn(
          {
            difficulty,
            warnings: difficultyResult.warnings,
          },
          'Question types do not match expected difficulty'
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
          question_count: visualizedQuestions.length,
          exam_length: request.examLength,
          status: 'created',
        },
        visualizedQuestions
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

  const visuals = await extractVisualsForRequest(request);
  logger.info(
    {
      visualCount: visuals.length,
    },
    'Prepared visual assets for flashcard generation'
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
    contentType: request.contentType,
    enhancedTopics, // NEW: Pass enhanced topics
    distribution, // NEW: Pass calculated distribution
    visuals,
    targetProvider: request.targetProvider,
  });

  const normalizedQuestions: Question[] = questions.map((question, index) => ({
    id: question.id,
    question_set_id: question.question_set_id,
    question_text: question.question_text,
    explanation: question.explanation,
    image_url: question.image_url,
    image_reference: question.image_reference,
    requires_visual: question.requires_visual,
    order_index: index,
    topic: question.topic,
    skill: question.skill,
    subtopic: question.subtopic,
    concept_id: (question as Question & { concept_id?: string }).concept_id,
    question_type: 'flashcard',
    correct_answer:
      typeof (question as any).correct_answer === 'string'
        ? (question as any).correct_answer
        : String((question as any).correct_answer ?? ''),
  }));
  const visualizedQuestions = await attachVisualAssetsToQuestions(normalizedQuestions, visuals, {
    prefix: `${request.subject}_flashcard`,
    logger,
  });
  const dependencyOrderedQuestions = applyDependencyOrdering(
    visualizedQuestions,
    request.subject,
    request.grade,
    logger,
    { mode: 'flashcard' }
  );

  if (dependencyOrderedQuestions.length === 0) {
    const diagnostics = diagnoseFlashcardFailure(request, questions.length);

    logger.error(
      {
        diagnostics,
        subject: request.subject,
        topic: request.topic,
        materialLength: diagnostics.materialLength,
      },
      'Zero flashcard questions generated'
    );

    let errorMessage = 'Muistikorttien luonti epäonnistui: Ei kysymyksiä luotu.\n\n';

    if (diagnostics.issues.length > 0) {
      errorMessage += 'Havaitut ongelmat:\n';
      diagnostics.issues.forEach(issue => {
        errorMessage += `• ${issue}\n`;
      });
    }

    if (diagnostics.suggestions.length > 0) {
      errorMessage += '\nEhdotukset:\n';
      diagnostics.suggestions.forEach(suggestion => {
        errorMessage += `• ${suggestion}\n`;
      });
    }

    errorMessage += '\nVarmista että:\n';
    errorMessage += '• Materiaali sisältää opetettavia sääntöjä tai konsepteja\n';
    errorMessage += '• Aihe-kentässä on kuvaava aihe (esim. "Kielioppi", "Verbit")\n';
    errorMessage += '• Materiaalia on vähintään 200 merkkiä\n';

    const error: FlashcardGenerationError = new Error(errorMessage);
    error.diagnostics = diagnostics;
    throw error;
  }

  logger.info(
    { questionCount: dependencyOrderedQuestions.length },
    'Flashcard questions generated successfully'
  );

  // Validate coverage if distribution was used (Phase 3)
    if (distribution) {
      const coverageResult = validateCoverage(dependencyOrderedQuestions, distribution);

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
        logger.debug(
          { report: formatCoverageReport(coverageResult) },
          'Coverage validation report'
        );
      }

    // Warn if coverage is poor
    if (!coverageResult.isAcceptable) {
      logger.warn(
        {
          warnings: coverageResult.warnings,
          overallDeviation: coverageResult.overallDeviation,
          threshold: Math.round(dependencyOrderedQuestions.length * 0.1),
        },
        'Generated flashcard questions do not meet coverage targets'
      );
    }
  }

  // Validate difficulty consistency (Phase 4)
  if (enhancedTopics && enhancedTopics.length > 0) {
    const expectedDifficulty = calculateWeightedDifficulty(
      enhancedTopics.map(t => ({
        difficulty: t.difficulty,
        coverage: t.coverage,
      }))
    );

    const difficultyResult = validateDifficultyConsistency(dependencyOrderedQuestions, expectedDifficulty);

    logger.info(
      {
        expectedDifficulty,
        questionTypes: Object.entries(difficultyResult.questionTypes).map(([type, pct]) => ({
          type,
          percentage: Math.round((pct as number) * 100),
        })),
        isConsistent: difficultyResult.isConsistent,
      },
      'Difficulty consistency validation for flashcard set'
    );

    if (!difficultyResult.isConsistent) {
      logger.warn(
        {
          warnings: difficultyResult.warnings,
        },
        'Flashcard question types do not match expected difficulty'
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
        question_count: dependencyOrderedQuestions.length,
        exam_length: request.examLength,
        status: 'created',
      },
      dependencyOrderedQuestions
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
