import type { Answer } from '@/types';

export type QuestionDetailStatus = 'correct' | 'wrong' | 'skipped';
export type CelebrationType = 'perfect-score' | 'all-badges';

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

export interface CelebrationDetectionInput {
  score: number;
  total: number;
  skippedQuestions?: string[];
  questionSetCode?: string;
  allBadgesUnlocked: boolean;
  hasCelebratedPerfect: boolean;
  hasCelebratedAllBadges: boolean;
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

export function isPerfectScoreSession(params: {
  score: number;
  total: number;
  skippedQuestions?: string[];
}): boolean {
  return params.score === params.total && (!params.skippedQuestions || params.skippedQuestions.length === 0);
}

export function getCelebrationQueue(params: CelebrationDetectionInput): CelebrationType[] {
  const celebrations: CelebrationType[] = [];
  const isPerfect = isPerfectScoreSession({
    score: params.score,
    total: params.total,
    skippedQuestions: params.skippedQuestions,
  });

  if (isPerfect && Boolean(params.questionSetCode) && !params.hasCelebratedPerfect) {
    celebrations.push('perfect-score');
  }

  if (params.allBadgesUnlocked && !params.hasCelebratedAllBadges) {
    celebrations.push('all-badges');
  }

  return celebrations;
}

export function getNextCelebration(
  queue: CelebrationType[],
  current: CelebrationType | null
): CelebrationType | null {
  if (!current) {
    return null;
  }

  const currentIndex = queue.indexOf(current);
  if (currentIndex === -1 || currentIndex >= queue.length - 1) {
    return null;
  }

  return queue[currentIndex + 1] ?? null;
}
