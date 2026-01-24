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
    case 'map': {
      const { inputMode, regions } = question.options;

      if (inputMode === 'single_region') {
        return {
          isCorrect: userAnswer === question.correct_answer,
          correctAnswer: question.correct_answer,
        };
      }

      if (inputMode === 'multi_region') {
        const correctIds = Array.isArray(question.correct_answer)
          ? question.correct_answer
          : [question.correct_answer as string];
        const userIds = Array.isArray(userAnswer) ? userAnswer : [];
        const correctSet = new Set(correctIds);
        const userSet = new Set(userIds);
        const isCorrect =
          correctSet.size === userSet.size
          && [...correctSet].every((id) => userSet.has(id));
        return { isCorrect, correctAnswer: correctIds };
      }

      if (inputMode === 'text') {
        const answerText = typeof userAnswer === 'string' ? userAnswer : '';
        let targetAnswer = typeof question.correct_answer === 'string'
          ? question.correct_answer
          : '';
        let acceptableAnswers: string[] | undefined;
        const regionMatch = regions.find((region) => region.id === targetAnswer);
        if (regionMatch) {
          targetAnswer = regionMatch.label;
          acceptableAnswers = regionMatch.aliases;
        } else {
          const labelMatch = regions.find(
            (region) => region.label.toLowerCase().trim() === targetAnswer.toLowerCase().trim()
          );
          acceptableAnswers = labelMatch?.aliases;
        }

        return {
          isCorrect: isAnswerAcceptable(answerText, targetAnswer, acceptableAnswers, grade),
          correctAnswer: targetAnswer,
        };
      }

      return {
        isCorrect: false,
        correctAnswer: question.correct_answer,
      };
    }
    default:
      return { isCorrect: false, correctAnswer: null };
  }
}
