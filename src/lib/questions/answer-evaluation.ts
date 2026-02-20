import type { Question } from '@/types';
import { isAnswerAcceptable } from '@/lib/utils/answerMatching';
import { smartValidateAnswer, type SmartMatchType } from '@/lib/utils/smartAnswerValidation';

export function evaluateQuestionAnswer(
  question: Question,
  userAnswer: unknown,
  grade?: number,
  subject?: string
): { isCorrect: boolean; correctAnswer: unknown; matchType?: SmartMatchType } {
  switch (question.question_type) {
    case 'multiple_choice':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
        matchType: userAnswer === question.correct_answer ? 'exact' : 'none',
      };
    case 'multiple_select': {
      const userSelections = Array.isArray(userAnswer)
        ? userAnswer.filter((value): value is string => typeof value === 'string')
        : [];
      const userSet = new Set(userSelections);
      const correctSet = new Set(question.correct_answers);

      if (userSet.size !== correctSet.size) {
        return {
          isCorrect: false,
          correctAnswer: question.correct_answers,
          matchType: 'none',
        };
      }

      for (const correct of correctSet) {
        if (!userSet.has(correct)) {
          return {
            isCorrect: false,
            correctAnswer: question.correct_answers,
            matchType: 'none',
          };
        }
      }

      return {
        isCorrect: true,
        correctAnswer: question.correct_answers,
        matchType: 'exact',
      };
    }
    case 'fill_blank': {
      const smartResult = smartValidateAnswer(
        String(userAnswer ?? ''),
        question.correct_answer,
        { questionType: question.question_type, subject }
      );
      const isCorrect = isAnswerAcceptable(
        String(userAnswer ?? ''),
        question.correct_answer,
        question.acceptable_answers,
        grade,
        { questionType: question.question_type, subject }
      );

      return {
        isCorrect,
        correctAnswer: question.correct_answer,
        matchType: isCorrect
          ? (smartResult.matchType !== 'none' ? smartResult.matchType : 'exact')
          : 'none',
      };
    }
    case 'true_false':
      return {
        isCorrect: userAnswer === question.correct_answer,
        correctAnswer: question.correct_answer,
        matchType: userAnswer === question.correct_answer ? 'exact' : 'none',
      };
    case 'matching': {
      const userMatches = (userAnswer ?? {}) as Record<string, string>;
      const isCorrect = question.pairs.every(
        (pair) => userMatches[pair.left] === pair.right
      );
      return { isCorrect, correctAnswer: question.pairs, matchType: isCorrect ? 'exact' : 'none' };
    }
    case 'short_answer': {
      const smartResult = smartValidateAnswer(
        String(userAnswer ?? ''),
        question.correct_answer,
        { questionType: question.question_type, subject }
      );
      const isCorrect = isAnswerAcceptable(
        String(userAnswer ?? ''),
        question.correct_answer,
        question.acceptable_answers,
        grade,
        { questionType: question.question_type, subject }
      );
      return {
        isCorrect,
        correctAnswer: question.correct_answer,
        matchType: isCorrect
          ? (smartResult.matchType !== 'none' ? smartResult.matchType : 'exact')
          : 'none',
      };
    }
    case 'sequential':
      return {
        isCorrect: JSON.stringify(userAnswer) === JSON.stringify(question.correct_order),
        correctAnswer: question.correct_order,
        matchType:
          JSON.stringify(userAnswer) === JSON.stringify(question.correct_order)
            ? 'exact'
            : 'none',
      };
    case 'flashcard': {
      const smartResult = smartValidateAnswer(
        String(userAnswer ?? ''),
        question.correct_answer,
        { questionType: question.question_type, subject }
      );
      const isCorrect = isAnswerAcceptable(
        String(userAnswer ?? ''),
        question.correct_answer,
        undefined,
        grade,
        { questionType: question.question_type, subject }
      );
      return {
        isCorrect,
        correctAnswer: question.correct_answer,
        matchType: isCorrect
          ? (smartResult.matchType !== 'none' ? smartResult.matchType : 'exact')
          : 'none',
      };
    }
    default:
      return { isCorrect: false, correctAnswer: null, matchType: 'none' };
  }
}
