import { Question, Subject, Difficulty } from '@/types';
import { generateWithClaude, MessageContent } from './anthropic';
import { getEnglishPrompt } from '@/config/prompts/english';
import { getMathPrompt } from '@/config/prompts/math';
import { getGenericPrompt } from '@/config/prompts/generic';
import { shuffleArray } from '@/lib/utils';
import { aiQuestionArraySchema } from '@/lib/validation/schemas';
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
}

/**
 * Generate questions using AI
 */
export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<Question[]> {
  const { subject, difficulty, questionCount, grade, materialText, materialFiles } = params;

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

  // Get prompt based on subject
  let prompt = '';
  const subjectLower = subject.toLowerCase();

  if (subjectLower === 'english' || subjectLower === 'englanti') {
    // Use specialized English prompt
    prompt = getEnglishPrompt(difficulty, questionCount, grade, materialText);
  } else if (subjectLower === 'math' || subjectLower === 'matematiikka') {
    // Use specialized Math prompt
    prompt = getMathPrompt(difficulty, questionCount, grade, materialText);
  } else {
    // Use generic prompt for all other subjects
    prompt = getGenericPrompt(subject, difficulty, questionCount, grade, materialText);
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

  // Validate AI response structure with Zod
  const validationResult = aiQuestionArraySchema.safeParse(parsedQuestions);
  if (!validationResult.success) {
    // Group errors by question index for better debugging
    const errorsByQuestion = validationResult.error.errors.reduce((acc, e) => {
      const questionIndex = typeof e.path[0] === 'number' ? e.path[0] : parseInt(String(e.path[0])) || 0;
      if (!acc[questionIndex]) acc[questionIndex] = [];
      acc[questionIndex].push({
        path: e.path.slice(1).join('.'),
        message: e.message,
      });
      return acc;
    }, {} as Record<number, Array<{ path: string; message: string }>>);

    logger.error(
      {
        totalQuestions: parsedQuestions.length,
        invalidQuestions: Object.keys(errorsByQuestion).length,
        errorsByQuestion: process.env.NODE_ENV === 'production'
          ? Object.entries(errorsByQuestion).map(([idx, errors]) => ({
              questionIndex: idx,
              errorCount: errors.length,
            }))
          : errorsByQuestion,
        sampleInvalidQuestion: process.env.NODE_ENV === 'production'
          ? undefined
          : parsedQuestions[parseInt(Object.keys(errorsByQuestion)[0]) || 0],
      },
      'AI response validation failed'
    );

    throw new Error('AI returned invalid question format. Please try again.');
  }

  parsedQuestions = validationResult.data;
  logger.info(
    {
      validatedQuestionCount: parsedQuestions.length,
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
        // Robustly convert to boolean (handles true, "true", "True", 1, etc.)
        const boolAnswer = typeof q.correct_answer === 'boolean'
          ? q.correct_answer
          : typeof q.correct_answer === 'string'
          ? q.correct_answer.toLowerCase() === 'true' || q.correct_answer === '1'
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

      default:
        // Default to multiple choice if type is unclear
        // Note: Should not happen as validation enforces valid types
        logger.warn(
          { questionType: q.type, questionText: q.question.substring(0, 50) },
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
