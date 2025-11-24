import { Question, Subject, Difficulty } from '@/types';
import { generateWithClaude, MessageContent } from './anthropic';
import { getEnglishPrompt } from '@/config/prompts/english';
import { getGenericPrompt } from '@/config/prompts/generic';
import { shuffleArray } from '@/lib/utils';
import { aiQuestionArraySchema } from '@/lib/validation/schemas';

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
  if (subject.toLowerCase() === 'english' || subject.toLowerCase() === 'englanti') {
    // Use specialized English prompt
    prompt = getEnglishPrompt(difficulty, questionCount, grade, materialText);
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
  } catch (error) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('Failed to parse AI response');
    } else {
      console.error('Failed to parse AI response:', cleanContent);
    }

    throw new Error('AI returned invalid JSON format');
  }

  // Validate AI response structure with Zod
  const validationResult = aiQuestionArraySchema.safeParse(parsedQuestions);
  if (!validationResult.success) {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      console.error('AI response validation failed');
    } else {
      console.error('AI response validation failed:', validationResult.error.errors);
    }

    throw new Error('AI returned invalid question format');
  }

  parsedQuestions = validationResult.data;

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
