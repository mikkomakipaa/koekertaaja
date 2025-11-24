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
    logger.error(
      {
        errors: validationResult.error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
        questionCount: parsedQuestions.length,
        firstQuestionSample: process.env.NODE_ENV === 'production'
          ? undefined
          : parsedQuestions[0],
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
  const questionsWithNulls = parsedQuestions
    .map((q, index): Question | null => {
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
          const shuffledOptions = shuffleArray<string>((q.options || []) as string[]);

          // Validate that we have at least 2 options
          if (!shuffledOptions || shuffledOptions.length < 2) {
            logger.warn(
              { questionText: q.question.substring(0, 100) },
              'Skipping multiple_choice question with insufficient options'
            );
            return null;
          }

          return {
            ...base,
            question_type: 'multiple_choice' as const,
            options: shuffledOptions,
            correct_answer: q.correct_answer as string,
          };

        case 'fill_blank':
          return {
            ...base,
            question_type: 'fill_blank' as const,
            correct_answer: q.correct_answer as string,
            acceptable_answers: q.acceptable_answers as string[] | undefined,
          };

        case 'true_false':
          return {
            ...base,
            question_type: 'true_false' as const,
            correct_answer: q.correct_answer === true || q.correct_answer === 'true',
          };

        case 'matching':
          // Validate that we have at least 1 pair
          if (!q.pairs || q.pairs.length < 1) {
            logger.warn(
              { questionText: q.question.substring(0, 100) },
              'Skipping matching question with no pairs'
            );
            return null;
          }

          return {
            ...base,
            question_type: 'matching' as const,
            pairs: q.pairs as Array<{ left: string; right: string }>,
          };

        default:
          // Default to multiple choice if type is unclear
          const defaultOptions = (q.options || []) as string[];
          if (defaultOptions.length < 2) {
            logger.warn(
              { questionText: q.question.substring(0, 100) },
              'Skipping question with unknown type and insufficient options'
            );
            return null;
          }

          return {
            ...base,
            question_type: 'multiple_choice' as const,
            options: defaultOptions,
            correct_answer: q.correct_answer as string,
          };
      }
    });

  // Filter out null values
  const questions: Question[] = questionsWithNulls.filter((q): q is Question => q !== null);

  // Log if any questions were filtered out
  if (questions.length < parsedQuestions.length) {
    logger.warn(
      {
        original: parsedQuestions.length,
        filtered: questions.length,
        removed: parsedQuestions.length - questions.length,
      },
      'Some questions were filtered out due to validation issues'
    );
  }

  return questions;
}
