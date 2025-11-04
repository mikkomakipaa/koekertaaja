import { Question, Subject, Difficulty } from '@/types';
import { generateWithClaude, MessageContent } from './anthropic';
import { getEnglishPrompt } from '@/config/prompts/english';
import { shuffleArray } from '@/lib/utils';

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
  switch (subject) {
    case 'english':
      prompt = getEnglishPrompt(difficulty, questionCount, grade, materialText);
      break;
    // Future subjects will be added here
    default:
      throw new Error(`Unsupported subject: ${subject}`);
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
    console.error('Failed to parse AI response:', cleanContent);
    throw new Error('AI returned invalid JSON format');
  }

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
        return {
          ...base,
          question_type: 'true_false' as const,
          correct_answer: q.correct_answer === true || q.correct_answer === 'true',
        };

      case 'matching':
        return {
          ...base,
          question_type: 'matching' as const,
          pairs: q.pairs || [],
        };

      default:
        // Default to multiple choice if type is unclear
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
