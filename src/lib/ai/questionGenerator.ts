import { Question, Subject, Difficulty } from '@/types';
import { generateWithClaude, MessageContent } from './anthropic';
import { getEnglishPrompt } from '@/config/prompts/english';
import { getMathPrompt } from '@/config/prompts/math';
import { getGenericPrompt } from '@/config/prompts/generic';
import { getEnglishFlashcardsPrompt } from '@/config/prompts/english-flashcards';
import { getMathFlashcardsPrompt } from '@/config/prompts/math-flashcards';
import { shuffleArray } from '@/lib/utils';
import { aiQuestionSchema, aiQuestionArraySchema } from '@/lib/validation/schemas';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ module: 'questionGenerator' });

export interface GenerateQuestionsParams {
  subject: Subject;
  difficulty: Difficulty;
  questionCount: number;
  grade?: number;
  materialText?: string;
  materialFiles?: Array<{
    type: string;
    name: string;
    data: string; // base64
  }>;
  mode?: 'quiz' | 'flashcard'; // NEW: mode for quiz or flashcard generation
}

/**
 * Generate questions using AI
 */
export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<Question[]> {
  const { subject, difficulty, questionCount, grade, materialText, materialFiles, mode = 'quiz' } = params;

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
  const subjectLower = subject.toLowerCase();

  if (mode === 'flashcard') {
    // Use flashcard-optimized prompts (no difficulty, optimized for memorization)
    if (subjectLower === 'english' || subjectLower === 'englanti') {
      prompt = getEnglishFlashcardsPrompt(questionCount, grade, materialText);
    } else if (subjectLower === 'math' || subjectLower === 'matematiikka') {
      prompt = getMathFlashcardsPrompt(questionCount, grade, materialText);
    } else {
      // For other subjects, use generic quiz prompt for now
      prompt = getGenericPrompt(subject, difficulty, questionCount, grade, materialText);
    }
  } else {
    // Use quiz prompts (original behavior)
    if (subjectLower === 'english' || subjectLower === 'englanti') {
      prompt = getEnglishPrompt(difficulty, questionCount, grade, materialText);
    } else if (subjectLower === 'math' || subjectLower === 'matematiikka') {
      prompt = getMathPrompt(difficulty, questionCount, grade, materialText);
    } else {
      prompt = getGenericPrompt(subject, difficulty, questionCount, grade, materialText);
    }
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
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        contentLength: cleanContent.length,
        contentPreview: process.env.NODE_ENV === 'production'
          ? undefined
          : cleanContent.substring(0, 500),
      },
      'Failed to parse AI response as JSON'
    );

    throw new Error('AI returned invalid JSON format. The response could not be parsed.');
  }

  // Validate AI response structure with Zod - filter out invalid questions gracefully
  const validQuestions: any[] = [];
  const invalidQuestions: Array<{ index: number; errors: any[]; question: any }> = [];
  const excludedFlashcardTypes: Array<{ index: number; type: string; question: any }> = [];

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

  // Fail only if we don't have enough valid questions (at least 70% of requested)
  const minRequiredQuestions = Math.ceil(questionCount * 0.7);
  if (validQuestions.length < minRequiredQuestions) {
    logger.error(
      {
        validQuestions: validQuestions.length,
        requestedQuestions: questionCount,
        minRequired: minRequiredQuestions,
        invalidCount: invalidQuestions.length,
      },
      'Too many invalid questions - insufficient valid questions generated'
    );
    throw new Error(`AI generated too few valid questions (${validQuestions.length}/${questionCount}). Please try again.`);
  }

  parsedQuestions = validQuestions;
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
          items: q.items || [],
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
