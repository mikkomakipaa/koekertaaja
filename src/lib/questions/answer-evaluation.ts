import type { Question } from '@/types';
import { isAnswerAcceptable } from '@/lib/utils/answerMatching';

export function evaluateQuestionAnswer(
  question: Question,
  userAnswer: unknown,
  grade?: number
): { isCorrect: boolean; correctAnswer: unknown } {
  switch (question.question_type) {
    case 'multiple_choice':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
      };
    case 'fill_blank':
      return {
        isCorrect: isAnswerAcceptable(
          String(userAnswer ?? ''),
          question.correct_answer,
          question.acceptable_answers,
          grade
        ),
        correctAnswer: question.correct_answer,
      };
    case 'true_false':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
      };
    case 'matching': {
      const userMatches = (userAnswer ?? {}) as Record<string, string>;
      const isCorrect = question.pairs.every(
        (pair) => userMatches[pair.left] === pair.right
      );
      return { isCorrect, correctAnswer: question.pairs };
    }
    case 'short_answer':
      return {
        isCorrect: isAnswerAcceptable(
          String(userAnswer ?? ''),
          question.correct_answer,
          question.acceptable_answers,
          grade
        ),
        correctAnswer: question.correct_answer,
      };
    case 'sequential':
      return {
        isCorrect: JSON.stringify(userAnswer) === JSON.stringify(question.correct_order),
        correctAnswer: question.correct_order,
      };
    default:
      return { isCorrect: false, correctAnswer: null };
  }
}
