import type { Question, StudyMode } from '@/types';

export const AIKAHAASTE_QUESTION_COUNT = 10;
export const AIKAHAASTE_TIME_LIMIT_SECONDS = 15;

export function isAikahaasteMode(params: {
  difficultyParam: string | null;
  studyMode: StudyMode;
  isReviewMode: boolean;
}): boolean {
  return params.difficultyParam === 'aikahaaste' && params.studyMode === 'pelaa' && !params.isReviewMode;
}

export function selectRandomQuestionsForAikahaaste(
  questions: Question[],
  count = AIKAHAASTE_QUESTION_COUNT,
  random: () => number = Math.random
): Question[] {
  const pool = questions.filter(
    (question) => question.question_type !== 'matching' && question.question_type !== 'multiple_select'
  );

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, Math.min(count, pool.length));
}

export function getAikahaasteTimeoutTransition(currentQuestionIndex: number, totalQuestions: number): {
  shouldEnd: boolean;
  nextQuestionIndex: number;
} {
  const lastQuestionIndex = Math.max(0, totalQuestions - 1);
  const safeCurrentIndex = Math.max(0, currentQuestionIndex);
  const shouldEnd = safeCurrentIndex >= lastQuestionIndex;

  return {
    shouldEnd,
    nextQuestionIndex: shouldEnd ? safeCurrentIndex : safeCurrentIndex + 1,
  };
}

export function shouldShowAikahaasteTimer(params: {
  isAikahaaste: boolean;
  isRunning: boolean;
  showIntro: boolean;
  state: 'loading' | 'error' | 'playing' | 'results';
}): boolean {
  return params.isAikahaaste && params.isRunning && !params.showIntro && params.state === 'playing';
}
