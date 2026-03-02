import type { Answer } from '@/types';

export type QuestionDetailStatus = 'correct' | 'wrong' | 'skipped';
export type CelebrationType = 'perfect-score' | 'all-badges';

export interface QuestionDetailItem {
  id: string;
  question: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType?: Answer['questionType'];
  questionOptions?: string[];
  rawCorrectAnswer?: unknown;
  rawUserAnswer?: unknown;
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

interface MatchingPairShape {
  left: string;
  right: string;
}

interface SequentialItemShape {
  text: string;
  year?: number;
}

function isMatchingPair(answer: unknown): answer is MatchingPairShape {
  return typeof answer === 'object'
    && answer !== null
    && typeof (answer as MatchingPairShape).left === 'string'
    && typeof (answer as MatchingPairShape).right === 'string';
}

function isSequentialItem(answer: unknown): answer is SequentialItemShape {
  return typeof answer === 'object'
    && answer !== null
    && typeof (answer as SequentialItemShape).text === 'string';
}

function formatPrimitiveAnswer(answer: string | number | boolean): string {
  if (typeof answer === 'boolean') {
    return answer ? 'Totta' : 'Tarua';
  }

  return String(answer);
}

function formatSequentialItem(item: string | SequentialItemShape): string {
  if (typeof item === 'string') {
    return item;
  }

  if (typeof item.year === 'number') {
    return `${item.year}: ${item.text}`;
  }

  return item.text;
}

function formatArrayAnswer(answer: unknown[], questionType?: Answer['questionType']): string {
  if (answer.length === 0) {
    return '';
  }

  if (answer.every((item) => typeof item === 'string')) {
    return questionType === 'sequential'
      ? answer.join(' → ')
      : answer.join(', ');
  }

  if (answer.every((item) => typeof item === 'number')) {
    return questionType === 'sequential'
      ? answer.map((item) => String(item + 1)).join(' → ')
      : answer.join(', ');
  }

  if (answer.every(isMatchingPair)) {
    return answer
      .map((pair) => `${pair.left} → ${pair.right}`)
      .join('; ');
  }

  if (answer.every((item) => typeof item === 'string' || isSequentialItem(item))) {
    return answer
      .map((item) => formatSequentialItem(item as string | SequentialItemShape))
      .join(questionType === 'sequential' ? ' → ' : ', ');
  }

  return answer
    .map((item) => formatResultAnswer(item, questionType))
    .filter((item) => item.length > 0)
    .join(', ');
}

function formatSequentialObject(answer: Record<string, unknown>): string {
  const items = Array.isArray(answer.items)
    ? answer.items.filter((item): item is string | SequentialItemShape => typeof item === 'string' || isSequentialItem(item))
    : [];
  const correctOrder = Array.isArray(answer.correct_order)
    ? answer.correct_order.filter((item): item is number => typeof item === 'number')
    : [];

  if (items.length > 0 && correctOrder.length > 0) {
    return correctOrder
      .map((index) => items[index])
      .filter((item): item is string | SequentialItemShape => item !== undefined)
      .map(formatSequentialItem)
      .join(' → ');
  }

  return '';
}

function formatObjectAnswer(answer: Record<string, unknown>, questionType?: Answer['questionType']): string {
  if (questionType === 'matching') {
    const entries = Object.entries(answer)
      .filter(([, value]) => typeof value === 'string')
      .map(([left, right]) => `${left} → ${right}`);

    if (entries.length > 0) {
      return entries.join('; ');
    }
  }

  if (questionType === 'sequential') {
    const sequential = formatSequentialObject(answer);
    if (sequential) {
      return sequential;
    }
  }

  if (isMatchingPair(answer)) {
    return `${answer.left} → ${answer.right}`;
  }

  if (isSequentialItem(answer)) {
    return formatSequentialItem(answer);
  }

  const entries = Object.entries(answer)
    .map(([key, value]) => {
      const formattedValue = formatResultAnswer(value, questionType);
      return formattedValue ? `${key}: ${formattedValue}` : '';
    })
    .filter((entry) => entry.length > 0);

  return entries.join('; ');
}

/**
 * Shared results-page answer formatter.
 * Keeps raw payloads for specialized UI, but converts supported answer shapes into MathText-friendly strings.
 */
export function formatResultAnswer(answer: unknown, questionType?: Answer['questionType']): string {
  if (typeof answer === 'string' || typeof answer === 'number' || typeof answer === 'boolean') {
    return formatPrimitiveAnswer(answer);
  }

  if (answer === null || answer === undefined) {
    return '';
  }

  if (Array.isArray(answer)) {
    return formatArrayAnswer(answer, questionType);
  }

  if (typeof answer === 'object') {
    return formatObjectAnswer(answer as Record<string, unknown>, questionType);
  }

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
      correctAnswer: formatResultAnswer(answer.correctAnswer, answer.questionType),
      userAnswer: formatResultAnswer(answer.userAnswer, answer.questionType) || undefined,
      questionType: answer.questionType,
      questionOptions: answer.questionOptions,
      rawCorrectAnswer: answer.correctAnswer,
      rawUserAnswer: answer.userAnswer,
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
