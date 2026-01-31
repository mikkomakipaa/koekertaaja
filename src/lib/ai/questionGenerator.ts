/**
 * Question Generator using Template-Based Prompt System
 *
 * This module generates AI questions using a template-based prompt architecture.
 * Prompts are stored as .txt files in /src/config/prompt-templates/ with {{variable}}
 * placeholders that are substituted at runtime.
 *
 * Components:
 * - PromptLoader: Loads prompt modules and substitutes variables
 * - PromptBuilder: Assembles prompts from modular templates
 *
 * Template structure:
 * - core/ (format, topic tagging, flashcard rules, distributions)
 * - types/ (language, math, written, skills, concepts)
 * - subjects/ (curriculum JSON per subject)
 *
 * Metadata:
 * - /src/config/prompt-templates/metadata/*.json (difficulty instructions)
 *
 * For template editing, see /Prompt-separation-plan.md
 */
import { Question, Subject, Difficulty, SequentialItem, isSequentialItemArray, isStringArray } from '@/types';
import { generateWithClaude, MessageContent } from './anthropic';
import { shuffleArray } from '@/lib/utils';
import { aiQuestionSchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';
import { PromptBuilder } from '@/lib/prompts/PromptBuilder';
import { PromptLoader } from '@/lib/prompts/PromptLoader';
import type { SubjectType } from '@/lib/prompts/subjectTypeMapping';
import { isRuleBasedSubject, validateRuleBasedQuestion } from '@/lib/utils/subjectClassification';

const logger = createLogger({ module: 'questionGenerator' });

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
}

/**
 * Generate questions using AI
 */
export async function generateQuestions(
  params: GenerateQuestionsParams
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
  } = params;

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
    },
    'Starting question generation'
  );

  // Build message content
  const messageContent: MessageContent[] = [];

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
    });

    logger.info(
      {
        subject,
        mode,
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

  // Call AI
  const response = await generateWithClaude(messageContent);

  // Parse JSON response
  const cleanContent = response.content.replace(/```json|```/g, '').trim();

  let parsedQuestions: any[];
  try {
    parsedQuestions = JSON.parse(cleanContent);
    logger.info(
      { questionCount: parsedQuestions.length },
      'Successfully parsed AI response'
    );
  } catch (error) {
    const sanitizedContent = sanitizeJsonString(cleanContent);

    try {
      parsedQuestions = JSON.parse(sanitizedContent);
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

      throw new Error('AI returned invalid JSON format. The response could not be parsed.');
    }
  }

  // Validate AI response structure with Zod - filter out invalid questions gracefully
  const validQuestions: any[] = [];
  const invalidQuestions: Array<{ index: number; errors: any[]; question: any }> = [];
  const excludedFlashcardTypes: Array<{ index: number; type: string; question: any }> = [];
  const excludedRuleBasedFormat: Array<{ index: number; reason: string; question: any }> = [];
  const normalizedSubject = subject.trim().toLowerCase();

  // Validate each question individually
  parsedQuestions.forEach((question, index) => {
    // CRITICAL: Flashcard mode must exclude passive recognition question types
    if (mode === 'flashcard') {
      const invalidFlashcardTypes = ['multiple_choice', 'true_false', 'sequential'];
      if (invalidFlashcardTypes.includes(question.type)) {
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
        return; // Skip this question
      }

      // CRITICAL: Validate rule-based format for applicable subjects
      const isRuleBased = isRuleBasedSubject(normalizedSubject, topic);
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
      'Excluded invalid question types for flashcard mode (multiple_choice, true_false, sequential not allowed)'
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
  const isRuleBasedFlashcard = mode === 'flashcard' && isRuleBasedSubject(subject, topic);

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

  logger.info(
    {
      validatedQuestionCount: validQuestions.length,
      subject,
      difficulty,
    },
    'AI response validated successfully'
  );

  // Validate and transform questions
  const questions: Question[] = parsedQuestions.map((q, index) => {
    const base = {
      id: '', // Will be set by database
      question_set_id: '', // Will be set by database
      question_text: q.question,
      explanation: q.explanation || '',
      order_index: index,
      topic: q.topic,  // High-level topic for stratified sampling
      skill: q.skill,
      subtopic: q.subtopic,
    };

    switch (q.type) {
      case 'multiple_choice':
        // Shuffle options to prevent pattern memorization
        // Note: Validation ensures options exist and have at least 2 items
        const shuffledOptions = shuffleArray(q.options || []);
        return {
          ...base,
          question_type: 'multiple_choice' as const,
          options: shuffledOptions,
          correct_answer: q.correct_answer,
        };

      case 'fill_blank':
        return {
          ...base,
          question_type: 'fill_blank' as const,
          correct_answer: q.correct_answer,
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
          correct_answer: q.correct_answer,
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
        // Log unknown type and default to multiple choice
        console.warn(`Unknown question type: ${q.type}, defaulting to multiple_choice`, {
          questionText: q.question?.substring(0, 50),
        });
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
