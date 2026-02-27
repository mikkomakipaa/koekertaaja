/**
 * Question Generator using Template-Based Prompt System
 *
 * This module generates AI questions using a template-based prompt architecture.
 * Prompts are stored as .txt files in /src/config/prompt-templates/ with {{variable}}
 * placeholders that are substituted at runtime.
 *
 * Components:
 * - PromptLoader: Loads prompt modules and substitutes variables
 * - PromptBuilder: Assembles provider-neutral contract prompts from modular templates
 *
 * Template structure:
 * - core/ (format, topic tagging, flashcard rules, guidance)
 * - types/ (language, math, written, skills, concepts)
 * - subjects/ (curriculum JSON per subject)
 *
 * Metadata:
 * - /src/config/prompt-templates/metadata/*.json (difficulty instructions)
 *
 * Intent-critical constraints (JSON contract, topic/skill coverage, Finnish pedagogy)
 * are centralized under /src/config/prompt-templates/core/.
 * For template editing, see /Prompt-separation-plan.md
 */
import { Question, Subject, Difficulty, SequentialItem, isSequentialItemArray, isStringArray } from '@/types';
import * as providerRouter from './providerRouter';
import type { AIMessageContent } from './providerTypes';
import type { AIProvider } from './providerTypes';
import { shuffleArray } from '@/lib/utils';
import { aiQuestionSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';
import { buildVisualQuestionPrompt, PromptBuilder } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import type { PromptMetadata } from '@/lib/prompts/promptVersion';
import { isRuleBasedSubject, validateRuleBasedQuestion } from '@/lib/utils/subjectClassification';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';
import { extractMaterialWithVisuals, parseImageReference, type ExtractedVisual } from '@/lib/utils/visualExtraction';
import { selectModelForTask } from './modelSelector';
import { calculateCost } from './costCalculator';
import { logPromptMetricsFireAndForget, type PromptMetricsInsert } from '@/lib/metrics/logPromptMetrics';
import { normalizeSubtopicLabel, normalizeTopicLabel } from '@/lib/topics/normalization';

const logger = createLogger({ module: 'questionGenerator' });
const VISUAL_QUESTION_SUPPORT_ENABLED = false;

const normalizeSequentialItems = (items: unknown): SequentialItem[] => {
  if (isSequentialItemArray(items)) {
    return items;
  }
  if (isStringArray(items)) {
    return items.map((text) => ({ text }));
  }
  return [];
};

const normalizeSkillTag = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.toLowerCase().replace(/[^a-z_]/g, '_');
};

const sanitizeJsonString = (input: string): string => {
  let output = '';
  let inString = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      output += char;
      continue;
    }

    if (char === '"') {
      inString = false;
      output += char;
      continue;
    }

    if (char === '\\') {
      const next = input[i + 1];
      if (next === undefined) {
        output += '\\\\';
        continue;
      }

      if (next === 'u') {
        const hex = input.slice(i + 2, i + 6);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          output += `\\u${hex}`;
          i += 5;
          continue;
        }
      }

      if ('"\\/bfnrt'.includes(next)) {
        output += `\\${next}`;
        i += 1;
        continue;
      }

      // Invalid escape sequence inside a string, escape the backslash itself.
      output += '\\\\';
      continue;
    }

    if (char === '\n') {
      output += '\\n';
      continue;
    }

    if (char === '\r') {
      output += '\\r';
      continue;
    }

    if (char === '\t') {
      output += '\\t';
      continue;
    }

    output += char;
  }

  return output;
};

/**
 * Validate that target words are included in the generated questions
 */
const validateTargetWordCoverage = (
  questions: any[],
  targetWords: string[]
): {
  foundWords: string[];
  missingWords: string[];
  coveragePercentage: number;
} => {
  const foundWords = new Set<string>();

  // Check each question for target words
  questions.forEach((question) => {
    const questionText = [
      question.question || '',
      question.explanation || '',
      ...(Array.isArray(question.options) ? question.options : []),
      ...(question.pairs?.flatMap((p: any) => [p.left, p.right]) || []),
      ...(question.items?.map((i: any) => (typeof i === 'string' ? i : i.text)) || []),
      question.correct_answer,
      ...(question.acceptable_answers || []),
    ]
      .join(' ')
      .toLowerCase();

    targetWords.forEach((word) => {
      if (questionText.includes(word.toLowerCase())) {
        foundWords.add(word);
      }
    });
  });

  const missingWords = targetWords.filter((word) => !foundWords.has(word));
  const coveragePercentage = targetWords.length > 0
    ? (foundWords.size / targetWords.length) * 100
    : 100;

  return {
    foundWords: Array.from(foundWords),
    missingWords,
    coveragePercentage: Number(coveragePercentage.toFixed(1)),
  };
};

const validateQuestionVariety = (
  questions: Array<{ type?: string }>
): {
  valid: boolean;
  warnings: string[];
  typeCounts: Record<string, number>;
} => {
  if (questions.length === 0) {
    return { valid: true, warnings: [], typeCounts: {} };
  }

  const typeCounts = questions.reduce<Record<string, number>>((acc, question) => {
    const type = question.type ?? 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const total = questions.length;
  const warnings: string[] = [];

  Object.entries(typeCounts).forEach(([type, count]) => {
    const percentage = (count / total) * 100;
    if (percentage > 80) {
      warnings.push(
        `${Math.round(percentage)}% kysymyksistä on tyyppiä "${type}" - harkitse monipuolisempaa yhdistelmää`
      );
    }
  });

  if (Object.keys(typeCounts).length === 1 && total > 5) {
    warnings.push('Kaikki kysymykset ovat samaa tyyppiä - lisää monipuolisuutta.');
  }

  return {
    valid: warnings.length === 0,
    warnings,
    typeCounts,
  };
};

export interface GenerateQuestionsParams {
  subject: Subject;
  subjectType?: SubjectType;
  difficulty: Difficulty;
  questionCount: number;
  grade?: number;
  topic?: string; // Topic for subject (e.g., "Grammar", "Geometry")
  subtopic?: string; // Subtopic within topic
  materialText?: string;
  materialFiles?: Array<{
    type: string;
    name: string;
    data: string; // base64
  }>;
  mode?: 'quiz' | 'flashcard'; // Mode for quiz or flashcard generation
  identifiedTopics?: string[]; // Pre-identified topics from Step 1 (optional - legacy)
  targetWords?: string[]; // Target vocabulary words that must be included
  enhancedTopics?: import('@/lib/ai/topicIdentifier').EnhancedTopic[]; // Enhanced topics with coverage/keywords (Phase 2)
  distribution?: import('@/lib/utils/questionDistribution').TopicDistribution[]; // Calculated distribution (Phase 2)
  contentType?: 'vocabulary' | 'grammar' | 'mixed';
  visuals?: ExtractedVisual[];
  targetProvider?: AIProvider;
  onPromptMetadata?: (promptMetadata: PromptMetadata) => void;
  metricsContext?: {
    userId?: string;
    questionSetId?: string;
    retryCount?: number;
  };
}

interface GenerateQuestionsDeps {
  generateWithAI?: typeof providerRouter.generateWithAI;
}

function calculateVarietyScore(
  questions: Array<{ type?: string }>
): number {
  if (questions.length === 0) {
    return 0;
  }

  const uniqueTypes = new Set(
    questions
      .map((question) => question.type)
      .filter((type): type is string => typeof type === 'string' && type.trim().length > 0)
  );

  const score = (uniqueTypes.size / questions.length) * 100;
  return Number(score.toFixed(2));
}

function toAnswerString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function normalizeQuestionType(rawType: unknown, mode: 'quiz' | 'flashcard'): string | undefined {
  if (mode === 'flashcard') {
    return 'flashcard';
  }
  if (typeof rawType !== 'string') {
    return undefined;
  }

  const normalized = rawType.trim().toLowerCase().replace(/[\s-]/g, '_');
  const typeMap: Record<string, string> = {
    mcq: 'multiple_choice',
    multiple_choice_question: 'multiple_choice',
    multiplechoice: 'multiple_choice',
    multiple_choice: 'multiple_choice',
    multiple_select: 'multiple_select',
    multiple_select_question: 'multiple_select',
    multipleselect: 'multiple_select',
    fill_in_the_blank: 'fill_blank',
    fill_blank: 'fill_blank',
    truefalse: 'true_false',
    true_false: 'true_false',
    shortanswer: 'short_answer',
    short_answer: 'short_answer',
    matching: 'matching',
    sequential: 'sequential',
    flashcard: 'flashcard',
  };

  return typeMap[normalized] ?? normalized;
}

function normalizeAIQuestionShape(
  rawQuestion: any,
  context: {
    mode: 'quiz' | 'flashcard';
    fallbackTopic?: string;
    fallbackSubtopic?: string;
    index: number;
  }
) {
  if (!rawQuestion || typeof rawQuestion !== 'object') {
    return rawQuestion;
  }

  const question = { ...rawQuestion };

  if (typeof question.question !== 'string') {
    question.question = question.question_text ?? question.prompt ?? question.front ?? question.title;
  }

  const normalizedType = normalizeQuestionType(
    question.type ?? question.question_type ?? question.kind,
    context.mode
  );
  if (normalizedType) {
    question.type = normalizedType;
  }

  if (question.correct_answer === undefined || question.correct_answer === null || question.correct_answer === '') {
    question.correct_answer =
      question.correctAnswer ??
      question.answer ??
      question.correct ??
      question.expected_answer ??
      question.expectedAnswer;
  }

  if (!question.acceptable_answers && Array.isArray(question.acceptableAnswers)) {
    question.acceptable_answers = question.acceptableAnswers;
  }

  if (!question.options && Array.isArray(question.choices)) {
    question.options = question.choices;
  }

  if (question.type === 'multiple_select') {
    if (!Array.isArray(question.correct_answers)) {
      question.correct_answers =
        question.correctAnswers ??
        question.answers ??
        question.correct ??
        (Array.isArray(question.correct_answer) ? question.correct_answer : []);
    }

    if (Array.isArray(question.options) && Array.isArray(question.correct_answers)) {
      question.correct_answers = question.correct_answers
        .filter((answer: unknown): answer is string => typeof answer === 'string')
        .filter((answer: string) => question.options.includes(answer));
    }
  }

  if (!question.explanation && typeof question.rationale === 'string') {
    question.explanation = question.rationale;
  }
  if (!question.explanation || String(question.explanation).trim().length < 10) {
    const fallbackAnswer =
      typeof question.correct_answer === 'string'
        ? question.correct_answer
        : Array.isArray(question.correct_answers)
          ? question.correct_answers.join(', ')
        : Array.isArray(question.correct_answer)
          ? question.correct_answer.join(', ')
          : String(question.correct_answer ?? '');
    question.explanation = `Oikea vastaus on ${fallbackAnswer || 'annettu vastaus'}.`;
  }

  if (typeof question.topic !== 'string' || question.topic.trim().length === 0) {
    question.topic = context.fallbackTopic || 'Yleinen';
  }
  if (typeof question.topic === 'string') {
    question.topic = normalizeTopicLabel(question.topic, {
      context: `questionGenerator.question[${context.index}].topic`,
      onUnexpectedEnglish: (event) => {
        logger.warn(
          {
            kind: event.kind,
            input: event.input,
            normalized: event.normalized,
            context: event.context,
          },
          'Unexpected unmapped English topic label encountered during AI post-processing'
        );
      },
    });
  }

  if ((typeof question.subtopic !== 'string' || question.subtopic.trim().length === 0) && context.fallbackSubtopic) {
    question.subtopic = context.fallbackSubtopic;
  }
  if (typeof question.subtopic === 'string') {
    question.subtopic = normalizeSubtopicLabel(question.subtopic, {
      context: `questionGenerator.question[${context.index}].subtopic`,
      onUnexpectedEnglish: (event) => {
        logger.warn(
          {
            kind: event.kind,
            input: event.input,
            normalized: event.normalized,
            context: event.context,
          },
          'Unexpected unmapped English topic label encountered during AI post-processing'
        );
      },
    });
  }

  if (context.mode === 'flashcard') {
    question.type = 'flashcard';
  }

  return question;
}

/**
 * Generate questions using AI
 */
export async function generateQuestions(
  params: GenerateQuestionsParams,
  deps: GenerateQuestionsDeps = {}
): Promise<Question[]> {
  const {
    subject,
    subjectType,
    difficulty,
    questionCount,
    grade,
    topic,
    subtopic,
    materialText,
    materialFiles,
    mode = 'quiz',
    identifiedTopics,
    targetWords,
    enhancedTopics,
    distribution,
    contentType,
    visuals,
    targetProvider,
    onPromptMetadata,
    metricsContext,
  } = params;

  const extractedMaterial = visuals
    ? {
      text: materialText ?? '',
      visuals,
      metadata: {
        hasVisuals: visuals.length > 0,
        visualCount: visuals.length,
        imageFileCount: visuals.length,
        pdfFileCount: 0,
      },
    }
    : await extractMaterialWithVisuals({
      materialText,
      materialFiles,
      maxVisuals: 8,
    });
  const effectiveVisuals = VISUAL_QUESTION_SUPPORT_ENABLED ? extractedMaterial.visuals : [];

  logger.info(
    {
      subject,
      difficulty,
      questionCount,
      mode,
      hasIdentifiedTopics: !!identifiedTopics,
      topicCount: identifiedTopics?.length,
      hasTargetWords: !!targetWords,
      targetWordCount: targetWords?.length,
      hasEnhancedTopics: !!enhancedTopics,
      enhancedTopicCount: enhancedTopics?.length,
      hasDistribution: !!distribution,
      visualCount: effectiveVisuals.length,
    },
    'Starting question generation'
  );

  // Build message content
  const messageContent: AIMessageContent[] = [];

  // Add uploaded files
  if (materialFiles && materialFiles.length > 0) {
    for (const file of materialFiles) {
      if (file.type === 'application/pdf') {
        messageContent.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: file.data,
          },
        });
      } else if (file.type.startsWith('image/')) {
        messageContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type,
            data: file.data,
          },
        });
      } else if (file.type.startsWith('text/')) {
        // Text files are included in the prompt
      }
    }
  }

  // Get prompt based on subject and mode
  let prompt = '';
  let promptMetadata: PromptMetadata | undefined;
  const loader = new PromptLoader();
  const builder = new PromptBuilder(loader);

  try {
    logger.info(
      {
      subject,
      subjectType,
      mode,
      hasFiles: Boolean(materialFiles && materialFiles.length > 0),
    },
    'Assembling prompt modules'
  );

    prompt = await builder.assemblePrompt({
      subject,
      subjectType,
      difficulty,
      questionCount,
      grade,
      materialText,
      materialFiles,
      mode,
      identifiedTopics,
      targetWords,
      enhancedTopics,
      distribution,
      contentType,
    });
    promptMetadata = builder.getPromptMetadata();
    onPromptMetadata?.(promptMetadata);

    const visualPrompt = buildVisualQuestionPrompt({
      visuals: effectiveVisuals,
      questionCount,
    });
    if (visualPrompt) {
      prompt = `${prompt}\n\n${visualPrompt}`;
    }

    logger.info(
      {
        subject,
        mode,
        promptVersions: Object.keys(promptMetadata?.versions ?? {}).length,
      },
      'Prompt assembled successfully'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error(
      {
        error: message,
        subject,
        mode,
      },
      'Failed to assemble prompt'
    );

    throw new Error(`Prompt assembly failed: ${message}`);
  }

  messageContent.push({
    type: 'text',
    text: prompt,
  });

  const hasVisuals = effectiveVisuals.length > 0;
  const modelTask = hasVisuals ? 'visual_questions' : mode === 'flashcard' ? 'flashcard_creation' : 'question_generation';
  const selectedModel = selectModelForTask(modelTask, {
    hasVisuals,
    isConceptual: contentType === 'grammar' || contentType === 'mixed',
    subject,
    targetProvider,
  });
  const aiCallStartedAt = Date.now();
  let aiRetryCount = 0;
  logger.info(
    {
      provider: selectedModel.provider,
      model: selectedModel.model,
      modelTask,
      messageCount: messageContent.length,
    },
    'Calling AI for question generation'
  );

  // Call AI
  const generateWithAI = deps.generateWithAI ?? providerRouter.generateWithAI;
  let response = await generateWithAI(messageContent, {
    provider: selectedModel.provider,
    model: selectedModel.model,
  });
  logger.info(
    {
      provider: selectedModel.provider,
      model: selectedModel.model,
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
      latencyMs: Date.now() - aiCallStartedAt,
    },
    'AI response received for question generation'
  );

  // Parse JSON response
  let cleanContent = response.content.replace(/```json|```/g, '').trim();

  // GPT-5-mini can occasionally return an empty list for large quiz payloads.
  // Retry once with a stronger model before failing.
  if (
    mode === 'quiz' &&
    selectedModel.provider === 'openai' &&
    (cleanContent === '[]' || cleanContent.length < 3)
  ) {
    aiRetryCount += 1;
    logger.warn(
      { model: selectedModel.model, contentLength: cleanContent.length },
      'OpenAI returned empty/near-empty quiz payload - retrying once with gpt-5.1'
    );
    response = await generateWithAI(messageContent, {
      provider: 'openai',
      model: 'gpt-5.1',
      maxTokens: 16000,
    });
    cleanContent = response.content.replace(/```json|```/g, '').trim();
  }

  let parsedQuestions: any[];
  try {
    const parsedResponse = JSON.parse(cleanContent);
    if (Array.isArray(parsedResponse)) {
      parsedQuestions = parsedResponse;
    } else if (parsedResponse && Array.isArray((parsedResponse as { questions?: unknown[] }).questions)) {
      parsedQuestions = (parsedResponse as { questions: unknown[] }).questions as any[];
      logger.warn('AI returned wrapped response object - using "questions" array');
    } else {
      throw new Error('AI response JSON is not an array');
    }
    logger.info({ questionCount: parsedQuestions.length }, 'Successfully parsed AI response');
  } catch (error) {
    const sanitizedContent = sanitizeJsonString(cleanContent);

    try {
      const parsedResponse = JSON.parse(sanitizedContent);
      if (Array.isArray(parsedResponse)) {
        parsedQuestions = parsedResponse;
      } else if (parsedResponse && Array.isArray((parsedResponse as { questions?: unknown[] }).questions)) {
        parsedQuestions = (parsedResponse as { questions: unknown[] }).questions as any[];
        logger.warn('AI returned wrapped response object after sanitizing - using "questions" array');
      } else {
        throw new Error('AI response JSON is not an array');
      }
      logger.warn(
        {
          error: error instanceof Error ? error.message : String(error),
          contentLength: cleanContent.length,
        },
        'Parsed AI response after sanitizing invalid JSON escapes'
      );
    } catch (secondError) {
      logger.error(
        {
          error: secondError instanceof Error ? secondError.message : String(secondError),
          contentLength: cleanContent.length,
          contentPreview: process.env.NODE_ENV === 'production'
            ? undefined
            : cleanContent.substring(0, 500),
        },
        'Failed to parse AI response as JSON'
      );

      logPromptMetricsFireAndForget({
        user_id: metricsContext?.userId ?? null,
        question_set_id: metricsContext?.questionSetId ?? null,
        subject,
        difficulty,
        mode,
        question_count_requested: questionCount,
        provider: selectedModel.provider,
        model: selectedModel.model,
        prompt_version: promptMetadata?.versions ?? null,
        question_count_generated: 0,
        question_count_valid: 0,
        generation_latency_ms: Date.now() - aiCallStartedAt,
        input_tokens: response.usage?.input_tokens ?? null,
        output_tokens: response.usage?.output_tokens ?? null,
        estimated_cost_usd: calculateCost(response.usage, selectedModel.model),
        validation_pass_rate: 0,
        skill_coverage: 0,
        topic_coverage: 0,
        type_variety_score: 0,
        had_errors: true,
        error_summary: secondError instanceof Error ? secondError.message : 'Invalid JSON response',
        retry_count: metricsContext?.retryCount ?? aiRetryCount,
      });

      throw new Error('AI returned invalid JSON format. The response could not be parsed.');
    }
  }

  // Validate AI response structure with Zod - filter out invalid questions gracefully
  const totalGeneratedByAI = parsedQuestions.length;
  const validQuestions: any[] = [];
  const invalidQuestions: Array<{ index: number; errors: any[]; question: any }> = [];
  const excludedFlashcardTypes: Array<{ index: number; type: string; question: any }> = [];
  const excludedRuleBasedFormat: Array<{ index: number; reason: string; question: any }> = [];
  const normalizedSubject = subject.trim().toLowerCase();

  // Validate each question individually
  parsedQuestions.forEach((rawQuestion, index) => {
    const question = normalizeAIQuestionShape(rawQuestion, {
      mode,
      fallbackTopic: topic ?? identifiedTopics?.[index % Math.max(identifiedTopics?.length || 1, 1)],
      fallbackSubtopic: subtopic,
      index,
    });
    // CRITICAL: Flashcard mode must exclude passive recognition question types
    if (mode === 'flashcard') {
      if (question.type && question.type !== 'flashcard') {
        excludedFlashcardTypes.push({
          index,
          type: question.type,
          question: {
            questionPreview: question.question?.substring(0, 50),
          },
        });
        logger.warn(
          {
            questionIndex: index,
            questionType: question.type,
            mode,
          },
          'Excluded invalid question type for flashcard mode - AI generated passive recognition type'
        );
        return;
      }

      // Accept prompt format using "answer" while normalizing to internal schema.
      if (typeof question.answer === 'string' && !question.correct_answer) {
        question.correct_answer = question.answer;
      }
      question.type = 'flashcard';

      // Flashcards should be direct Q&A, not fill-in-the-blank prompts.
      if (typeof question.question === 'string' && question.question.includes('___')) {
        excludedFlashcardTypes.push({
          index,
          type: 'fill_blank_pattern',
          question: {
            questionPreview: question.question.substring(0, 50),
          },
        });
        logger.warn(
          {
            questionIndex: index,
            questionPreview: question.question.substring(0, 50),
          },
          'Excluded invalid flashcard format containing blank placeholder'
        );
        return;
      }

      // CRITICAL: Validate rule-based format for applicable subjects
      const isRuleBased = isRuleBasedSubject(normalizedSubject, topic, contentType);
      if (isRuleBased) {
        const validation = validateRuleBasedQuestion(
          question,
          normalizedSubject,
          topic
        );

        if (!validation.valid) {
          excludedRuleBasedFormat.push({
            index,
            reason: validation.reason || 'Invalid rule-based format',
            question: {
              questionPreview: question.question?.substring(0, 50),
            },
          });
          logger.warn(
            {
              questionIndex: index,
              questionPreview: question.question?.substring(0, 50),
              reason: validation.reason,
              subject: normalizedSubject,
              topic,
            },
            'Excluded invalid rule-based flashcard format'
          );
          return; // Skip this question
        }
      }
    }

    if (question.skill) {
      const normalizedSkill = normalizeSkillTag(question.skill);
      if (normalizedSkill && normalizedSkill !== question.skill) {
        logger.warn(
          { skill: question.skill, normalizedSkill, questionIndex: index },
          'Invalid skill format (not snake_case) - normalizing'
        );
      }
      question.skill = normalizedSkill;
    }

    const result = aiQuestionSchema.safeParse(question);
    if (result.success) {
      validQuestions.push(result.data);
    } else {
      invalidQuestions.push({
        index,
        errors: result.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
        question: {
          type: question.type,
          questionPreview: question.question?.substring(0, 50),
        },
      });
    }
  });

  // Log excluded flashcard types
  if (excludedFlashcardTypes.length > 0) {
    logger.warn(
      {
        excludedCount: excludedFlashcardTypes.length,
        mode,
        excludedTypes: excludedFlashcardTypes.map(({ type }) => type),
      },
      'Excluded invalid flashcard formats/types'
    );
  }

  // Log excluded rule-based format violations
  if (excludedRuleBasedFormat.length > 0) {
    logger.warn(
      {
        excludedCount: excludedRuleBasedFormat.length,
        subject,
        topic,
        mode,
        reasons: excludedRuleBasedFormat.map(({ reason }) => reason),
      },
      'Excluded invalid rule-based flashcard format (calculation questions instead of rule teaching)'
    );
  }

  // Log invalid questions as warnings (not errors) since we can continue without them
  if (invalidQuestions.length > 0) {
    logger.warn(
      {
        totalQuestions: parsedQuestions.length,
        validQuestions: validQuestions.length,
        invalidQuestions: invalidQuestions.length,
        invalidQuestionDetails: process.env.NODE_ENV === 'production'
          ? invalidQuestions.map(({ index, errors, question }) => ({
              questionIndex: index,
              errorCount: errors.length,
              errorPaths: errors.map(e => e.path),
              questionType: question.type,
            }))
          : invalidQuestions,
      },
      'Some AI-generated questions failed validation and were skipped'
    );
  }

  const skillCounts: Record<string, number> = {};
  let questionsWithSkills = 0;
  validQuestions.forEach((question, index) => {
    if (!question.skill) {
      logger.warn({ questionIndex: index, questionPreview: question.question?.substring(0, 50) }, 'Question missing skill field');
      return;
    }

    const normalizedSkill = normalizeSkillTag(question.skill);
    if (!normalizedSkill) {
      logger.warn({ skill: question.skill, questionIndex: index }, 'Invalid skill format (not snake_case) - removing');
      question.skill = undefined;
      return;
    }

    if (normalizedSkill !== question.skill) {
      logger.warn(
        { skill: question.skill, normalizedSkill, questionIndex: index },
        'Invalid skill format (not snake_case) - normalizing'
      );
      question.skill = normalizedSkill;
    }

    questionsWithSkills += 1;
    skillCounts[question.skill] = (skillCounts[question.skill] ?? 0) + 1;
  });

  const skillCoverage = validQuestions.length > 0 ? (questionsWithSkills / validQuestions.length) * 100 : 0;
  logger.info(
    {
      totalQuestions: validQuestions.length,
      questionsWithSkills,
      skillCoverage: Number(skillCoverage.toFixed(1)),
      skillDistribution: skillCounts,
    },
    'Skill tagging report'
  );

  if (skillCoverage < 90) {
    logger.warn(
      { skillCoverage: Number(skillCoverage.toFixed(1)) },
      'Low skill tagging coverage - check prompts'
    );
  }

  // Check topic coverage - all questions MUST have topics (validation enforces this)
  const questionsWithTopics = validQuestions.filter(q => q.topic && q.topic.trim().length > 0).length;
  const topicCoverage = validQuestions.length > 0 ? (questionsWithTopics / validQuestions.length) * 100 : 0;

  logger.info(
    {
      questionsWithTopics,
      totalValidQuestions: validQuestions.length,
      topicCoverage: `${topicCoverage.toFixed(1)}%`,
    },
    'Topic coverage report'
  );

  // Warn if any questions are missing topics (should never happen with strict validation)
  if (topicCoverage < 100) {
    logger.warn(
      {
        questionsWithTopics,
        totalValidQuestions: validQuestions.length,
        topicCoverage: `${topicCoverage.toFixed(1)}%`,
      },
      'Some questions missing topics - these should have been rejected by validation'
    );
  }

  // Validate target word coverage if target words were provided
  if (targetWords && targetWords.length > 0) {
    const wordCoverage = validateTargetWordCoverage(validQuestions, targetWords);

    logger.info(
      {
        targetWordsProvided: targetWords.length,
        wordsFoundInQuestions: wordCoverage.foundWords.length,
        wordCoveragePercentage: wordCoverage.coveragePercentage,
        missingWords: wordCoverage.missingWords,
      },
      'Target word coverage report'
    );

    // Warn if word coverage is low but don't fail the generation
    if (wordCoverage.coveragePercentage < 80) {
      logger.warn(
        {
          coveragePercentage: wordCoverage.coveragePercentage,
          missingWords: wordCoverage.missingWords,
          foundWords: wordCoverage.foundWords,
        },
        'Low target word coverage - some requested words are missing from questions'
      );
    }
  }

  // Fail only if we don't have enough valid questions
  // For flashcard mode, be more lenient since we actively filter out question types
  // For rule-based flashcards, be even more lenient (may only have 5-10 rules in material)
  const isRuleBasedFlashcard =
    mode === 'flashcard' && isRuleBasedSubject(subject, topic, contentType);

  let minRequiredQuestions: number;
  let thresholdDescription: string;

  if (isRuleBasedFlashcard) {
    // For rule-based: Accept minimum of 5 questions OR 20% of requested
    // Whichever is SMALLER (allows comprehensive coverage of small rule sets)
    const absoluteMin = 5;
    const percentageMin = Math.ceil(questionCount * 0.2); // 20%
    minRequiredQuestions = Math.min(absoluteMin, percentageMin);
    thresholdDescription = `5 min or 20% (rule-based minimum for comprehensive coverage)`;

    logger.info(
      {
        subject,
        topic,
        questionCount,
        minRequiredQuestions,
        reason: 'Rule-based flashcard - accepting smaller count for comprehensive rule coverage',
      },
      'Using rule-based minimum threshold'
    );
  } else {
    // Existing logic for non-rule subjects
    const baseRequiredPercentage = mode === 'flashcard' ? 0.4 : 0.7; // 40% for flashcard, 70% for quiz
    const requiredPercentage = questionCount <= 25
      ? Math.min(baseRequiredPercentage, 0.6)
      : baseRequiredPercentage;
    minRequiredQuestions = Math.ceil(questionCount * requiredPercentage);
    thresholdDescription = `${requiredPercentage * 100}%`;
  }

  if (validQuestions.length < minRequiredQuestions) {
    logger.error(
      {
        validQuestions: validQuestions.length,
        requestedQuestions: questionCount,
        minRequired: minRequiredQuestions,
        thresholdDescription,
        mode,
        isRuleBasedFlashcard,
        invalidCount: invalidQuestions.length,
        excludedFlashcardCount: excludedFlashcardTypes.length,
        excludedRuleBasedFormatCount: excludedRuleBasedFormat.length,
      },
      'Too many invalid questions - insufficient valid questions generated'
    );
    logPromptMetricsFireAndForget({
      user_id: metricsContext?.userId ?? null,
      question_set_id: metricsContext?.questionSetId ?? null,
      subject,
      difficulty,
      mode,
      question_count_requested: questionCount,
      provider: selectedModel.provider,
      model: selectedModel.model,
      prompt_version: promptMetadata?.versions ?? null,
      question_count_generated: totalGeneratedByAI,
      question_count_valid: validQuestions.length,
      generation_latency_ms: Date.now() - aiCallStartedAt,
      input_tokens: response.usage?.input_tokens ?? null,
      output_tokens: response.usage?.output_tokens ?? null,
      estimated_cost_usd: calculateCost(response.usage, selectedModel.model),
      validation_pass_rate: totalGeneratedByAI > 0 ? Number(((validQuestions.length / totalGeneratedByAI) * 100).toFixed(2)) : 0,
      skill_coverage: Number(skillCoverage.toFixed(2)),
      topic_coverage: Number(topicCoverage.toFixed(2)),
      type_variety_score: calculateVarietyScore(validQuestions),
      had_errors: true,
      error_summary: `Too few valid questions (${validQuestions.length}/${questionCount})`,
      retry_count: metricsContext?.retryCount ?? aiRetryCount,
    });
    throw new Error(
      `AI generated too few valid questions (${validQuestions.length}/${questionCount}). ` +
      `Required: ${minRequiredQuestions}+` +
      (isRuleBasedFlashcard ? ' (rule-based minimum threshold)' : '')
    );
  }

  // Log when rule-based flashcard set generates fewer than requested
  if (isRuleBasedFlashcard && validQuestions.length < questionCount) {
    logger.info(
      {
        requestedQuestions: questionCount,
        generatedQuestions: validQuestions.length,
        subject,
        topic,
      },
      'Rule-based flashcard set generated fewer questions than requested (comprehensive rule coverage achieved)'
    );
  }

  parsedQuestions = validQuestions;
  if (parsedQuestions.length > questionCount) {
    logger.warn(
      {
        requestedQuestions: questionCount,
        generatedQuestions: parsedQuestions.length,
        mode,
        difficulty,
      },
      'AI generated more questions than requested - trimming to requested count'
    );
    parsedQuestions = parsedQuestions.slice(0, questionCount);
  }

  if (mode !== 'flashcard') {
    const varietyCheck = validateQuestionVariety(parsedQuestions);
    logger.info(
      {
        questionCount: parsedQuestions.length,
        typeCounts: varietyCheck.typeCounts,
        hasWarnings: varietyCheck.warnings.length > 0,
      },
      'Question type variety report'
    );

    if (!varietyCheck.valid) {
      logger.warn(
        {
          warnings: varietyCheck.warnings,
          typeCounts: varietyCheck.typeCounts,
        },
        'Question type variety warnings'
      );
    }
  }

  logger.info(
    {
      validatedQuestionCount: validQuestions.length,
      subject,
      difficulty,
    },
    'AI response validated successfully'
  );

  const generatedCount = totalGeneratedByAI;
  const validCount = validQuestions.length;
  const validationPassRate = generatedCount > 0
    ? Number(((validCount / generatedCount) * 100).toFixed(2))
    : 0;
  const typeVarietyScore = calculateVarietyScore(parsedQuestions);
  const generationLatencyMs = Date.now() - aiCallStartedAt;
  const metricsData: PromptMetricsInsert = {
    user_id: metricsContext?.userId ?? null,
    question_set_id: metricsContext?.questionSetId ?? null,
    subject,
    difficulty,
    mode,
    question_count_requested: questionCount,
    provider: selectedModel.provider,
    model: selectedModel.model,
    prompt_version: promptMetadata?.versions ?? null,
    question_count_generated: generatedCount,
    question_count_valid: validCount,
    generation_latency_ms: generationLatencyMs,
    input_tokens: response.usage?.input_tokens ?? null,
    output_tokens: response.usage?.output_tokens ?? null,
    estimated_cost_usd: calculateCost(response.usage, selectedModel.model),
    validation_pass_rate: validationPassRate,
    skill_coverage: Number(skillCoverage.toFixed(2)),
    topic_coverage: Number(topicCoverage.toFixed(2)),
    type_variety_score: typeVarietyScore,
    had_errors: invalidQuestions.length > 0,
    error_summary: invalidQuestions.length > 0 ? `${invalidQuestions.length} validation failures` : null,
    retry_count: metricsContext?.retryCount ?? aiRetryCount,
  };
  logPromptMetricsFireAndForget(metricsData);

  // Validate and transform questions
  const questions: Question[] = parsedQuestions.map((q, index) => {
    const imageReference = VISUAL_QUESTION_SUPPORT_ENABLED && typeof q.image_reference === 'string'
      ? q.image_reference
      : undefined;
    const imageIndex = parseImageReference(imageReference);
    const requiresVisual = VISUAL_QUESTION_SUPPORT_ENABLED && Boolean(q.requires_visual ?? imageIndex !== null);

    const base = {
      id: '', // Will be set by database
      question_set_id: '', // Will be set by database
      question_text: q.question,
      explanation: q.explanation || '',
      order_index: index,
      image_reference: imageReference,
      requires_visual: requiresVisual,
      topic: q.topic,  // High-level topic for stratified sampling
      skill: q.skill,
      subtopic: q.subtopic,
      concept_id: dependencyResolver.extractConceptIdFromQuestion(subject, {
        concept_id: q.concept_id,
        subtopic: q.subtopic,
        skill: q.skill,
        topic: q.topic,
      }) ?? undefined,
    };

    switch (q.type) {
      case 'flashcard':
        return {
          ...base,
          question_type: 'flashcard' as const,
          correct_answer: toAnswerString(q.correct_answer ?? q.answer),
        };
      case 'multiple_choice':
        // Shuffle options to prevent pattern memorization
        // Note: Validation ensures options exist and have at least 2 items
        const shuffledOptions = shuffleArray(q.options || []);
        return {
          ...base,
          question_type: 'multiple_choice' as const,
          options: shuffledOptions,
          correct_answer: toAnswerString(q.correct_answer ?? q.answer),
        };

      case 'multiple_select': {
        const options = Array.isArray(q.options) ? q.options : [];
        const correctAnswers = Array.isArray(q.correct_answers)
          ? q.correct_answers
          : Array.isArray(q.correct_answer)
            ? q.correct_answer
            : [];

        return {
          ...base,
          question_type: 'multiple_select' as const,
          options,
          correct_answers: correctAnswers.filter((answer: unknown): answer is string =>
            typeof answer === 'string' && options.includes(answer)
          ),
        };
      }

      case 'fill_blank':
        return {
          ...base,
          question_type: 'fill_blank' as const,
          correct_answer: toAnswerString(q.correct_answer ?? q.answer),
          acceptable_answers: q.acceptable_answers,
        };

      case 'true_false':
        // Robustly convert to boolean (handles true, "true", "True", "totta", 1, etc.)
        const boolAnswer = typeof q.correct_answer === 'boolean'
          ? q.correct_answer
          : typeof q.correct_answer === 'string'
          ? ['true', '1', 'totta'].includes(q.correct_answer.toLowerCase())
          : typeof q.correct_answer === 'number'
          ? q.correct_answer === 1
          : Boolean(q.correct_answer);

        return {
          ...base,
          question_type: 'true_false' as const,
          correct_answer: boolAnswer,
        };

      case 'matching':
        // Note: Validation ensures pairs exist and have at least 2 items
        return {
          ...base,
          question_type: 'matching' as const,
          pairs: q.pairs || [],
        };

      case 'short_answer':
        return {
          ...base,
          question_type: 'short_answer' as const,
          correct_answer: toAnswerString(q.correct_answer ?? q.answer),
          max_length: q.max_length,
        };

      case 'sequential':
        // Note: Validation ensures items and correct_order exist
        return {
          ...base,
          question_type: 'sequential' as const,
          items: normalizeSequentialItems(q.items),
          correct_order: q.correct_order || [],
        };

      default:
        // In flashcard mode we still force canonical flashcard shape.
        if (mode === 'flashcard') {
          return {
            ...base,
            question_type: 'flashcard' as const,
            correct_answer: q.correct_answer || '',
          };
        }

        // Log unknown type and default to multiple choice
        logger.warn(
          {
            questionType: q.type,
            questionPreview: q.question?.substring(0, 50),
          },
          'Unknown question type, defaulting to multiple_choice'
        );
        return {
          ...base,
          question_type: 'multiple_choice' as const,
          options: q.options || [],
          correct_answer: q.correct_answer,
        };
    }
  });

  return questions;
}
