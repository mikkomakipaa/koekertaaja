import type { Answer } from '@/types';

export type QuestionDetailStatus = 'correct' | 'wrong' | 'skipped';

export interface QuestionDetailItem {
  id: string;
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  status: QuestionDetailStatus;
}

export interface ResultsBreakdown {
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
}

function stringifyAnswer(answer: unknown): string {
  if (typeof answer === 'string') return answer;
  if (answer === null || answer === undefined) return '';
  if (typeof answer === 'object') return JSON.stringify(answer);
  return String(answer);
}

export function toggleQuestionExpanded(current: string | null, questionId: string): string | null {
  return current === questionId ? null : questionId;
}

export function getResultsBreakdown(answers: Answer[], skippedQuestions?: string[]): ResultsBreakdown {
  const skippedSet = new Set(skippedQuestions ?? []);
  const skippedCount = skippedQuestions?.length || 0;
  const correctCount = answers.filter((answer) => answer.isCorrect).length;
  const wrongCount = answers.filter((answer) => !answer.isCorrect && !skippedSet.has(answer.questionId)).length;

  return {
    correctCount,
    wrongCount,
    skippedCount,
  };
}

export function buildQuestionDetails(answers: Answer[], skippedQuestions?: string[]): QuestionDetailItem[] {
  const skippedSet = new Set(skippedQuestions ?? []);

  return answers.map((answer) => {
    const isSkipped = skippedSet.has(answer.questionId);
    const status: QuestionDetailStatus = isSkipped ? 'skipped' : answer.isCorrect ? 'correct' : 'wrong';

    return {
      id: answer.questionId,
      question: answer.questionText,
      correctAnswer: stringifyAnswer(answer.correctAnswer),
      userAnswer: stringifyAnswer(answer.userAnswer) || undefined,
      status,
    };
  });
}
