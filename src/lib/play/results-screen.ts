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

type SchoolGradeSuffix = '' | '+' | '.5' | '-';

export interface SchoolGradeResult {
  label: string;
  numericValue: number;
  percentage: number;
  roundedQuarterSteps: number;
  normalizedValue: number;
}

export interface ResultsPrimaryOutcome {
  eyebrow: string;
  value: string;
}

export interface ResultsHeaderCopy {
  title: string;
  supportingText: string;
}

export type ResultsPerformanceBand = 'weak' | 'mid' | 'strong';
export type TopicMasteryLevel = 'weak' | 'mid' | 'strong';

export interface TopicMasterySourceStat {
  correct: number;
  total: number;
  percentage: number;
}

export interface TopicMasteryItem {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
  level: TopicMasteryLevel;
  statusLabel: string;
  guidance: string;
  reviewHref: string | null;
}

export function shouldShowReviewMistakesAction(
  reviewMistakeCount: number,
  onReviewMistakes?: (() => void) | null
): boolean {
  return reviewMistakeCount > 0 && typeof onReviewMistakes === 'function';
}

export function getReviewMistakesActionLabel(reviewMistakeCount: number): string {
  return `Kertaa virheet (${reviewMistakeCount})`;
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

function clampPercentage(percentage: number): number {
  if (!Number.isFinite(percentage)) {
    return 0;
  }

  return Math.max(0, Math.min(100, percentage));
}

function formatSchoolGradeLabel(normalizedValue: number, roundedQuarterSteps: number): string {
  if (normalizedValue <= 4) {
    return '4';
  }

  if (normalizedValue >= 10) {
    return '10';
  }

  const baseGrade = Math.floor(normalizedValue);
  const remainder = roundedQuarterSteps % 4;
  const suffixByRemainder: Record<number, SchoolGradeSuffix> = {
    0: '',
    1: '+',
    2: '.5',
    3: '-',
  };
  const suffix = suffixByRemainder[remainder] ?? '';

  if (suffix === '-') {
    return `${baseGrade + 1}-`;
  }

  return `${baseGrade}${suffix}`;
}

/**
 * Converts quiz performance into a Finnish school-grade string on the 4-10 scale.
 *
 * Rule:
 * - Map the percentage linearly to the closed interval [4, 10].
 * - Round that value to the nearest 0.25 grade step.
 * - Render quarter-step bands as:
 *   - `.00` -> integer (`8`)
 *   - `.25` -> plus (`8+`)
 *   - `.50` -> half (`8.5`)
 *   - `.75` -> next grade minus (`9-`)
 * - Clamp the final result so outputs never fall outside `4`...`10`.
 *
 * Examples:
 * - 0% -> `4`
 * - 50% -> `7`
 * - 75% -> `8.5`
 * - 96% -> `9.75` normalized -> `10-`
 * - 100% -> `10`
 */
export function getSchoolGrade(score: number, total: number): SchoolGradeResult {
  const safeScore = Number.isFinite(score) ? Math.max(0, score) : 0;
  const safeTotal = Number.isFinite(total) ? Math.max(0, total) : 0;
  const rawPercentage = safeTotal > 0 ? (safeScore / safeTotal) * 100 : 0;
  const percentage = clampPercentage(rawPercentage);
  const normalizedValue = 4 + (percentage / 100) * 6;
  const roundedQuarterSteps = Math.round(normalizedValue * 4);
  const numericValue = Math.max(4, Math.min(10, roundedQuarterSteps / 4));

  return {
    label: formatSchoolGradeLabel(numericValue, roundedQuarterSteps),
    numericValue,
    percentage: Math.round(percentage),
    roundedQuarterSteps,
    normalizedValue,
  };
}

export function getResultsPrimaryOutcome(
  score: number,
  total: number,
  mode: 'quiz' | 'flashcard' = 'quiz'
): ResultsPrimaryOutcome | null {
  if (mode !== 'quiz') {
    return null;
  }

  return {
    eyebrow: 'Arvosana',
    value: getSchoolGrade(score, total).label,
  };
}

export function getResultsHeaderCopy(
  score: number,
  total: number,
  mode: 'quiz' | 'flashcard' = 'quiz'
): ResultsHeaderCopy {
  void score;
  void total;

  if (mode === 'quiz') {
    return {
      title: 'Tulokset',
      supportingText: '',
    };
  }

  return {
    title: 'Tulokset',
    supportingText: '',
  };
}

export function getResultsSecondaryMeta(score: number, total: number): string {
  const grade = getSchoolGrade(score, total);
  return `${score} / ${total} oikein • ${grade.percentage}%`;
}

export function getResultsPerformanceBand(score: number, total: number): ResultsPerformanceBand {
  const { percentage } = getSchoolGrade(score, total);

  if (percentage >= 90) {
    return 'strong';
  }

  if (percentage >= 60) {
    return 'mid';
  }

  return 'weak';
}

export function getResultsFeedbackMessage(
  score: number,
  total: number,
  mode: 'quiz' | 'flashcard' = 'quiz'
): string {
  const { percentage } = getSchoolGrade(score, total);

  if (mode === 'flashcard') {
    if (percentage >= 90) {
      return 'Muistikortit sujuivat vahvasti. Voit jatkaa uuteen kierrokseen tai siirtyä visaan.';
    }

    if (percentage >= 60) {
      return 'Perusasiat ovat hallussa. Yksi uusi kierros vahvistaa muistia nopeasti.';
    }

    return 'Aloita heikoimmista aiheista. Lyhyt kertaus auttaa ennen seuraavaa kierrosta.';
  }

  if (percentage === 100) {
    return 'Täysi osuma. Voit pelata uudelleen tai siirtyä vaikeampaan harjoitteluun.';
  }

  if (percentage >= 90) {
    return 'Todella vahva tulos. Kertaa vain pienet epävarmat kohdat ennen seuraavaa kierrosta.';
  }

  if (percentage >= 75) {
    return 'Hyvä perusta on kasassa. Heikoimpien aiheiden kertaus nostaa tulosta nopeasti.';
  }

  if (percentage >= 60) {
    return 'Suunnan perusasiat löytyvät jo. Kohdennettu kertaus auttaa seuraavaan nousuun.';
  }

  return 'Aloita heikoimmista aiheista ja rakenna varmuus takaisin yksi aihe kerrallaan.';
}

export function getTopicMasteryLevel(percentage: number): TopicMasteryLevel {
  if (percentage >= 95) {
    return 'strong';
  }

  if (percentage >= 80) {
    return 'mid';
  }

  return 'weak';
}

export function getTopicMasteryStatusLabel(level: TopicMasteryLevel): string {
  switch (level) {
    case 'strong':
      return 'Vahva'
    case 'mid':
      return 'Kehittyy'
    default:
      return 'Kertaa seuraavaksi'
  }
}

export function getTopicMasteryGuidance(level: TopicMasteryLevel): string {
  switch (level) {
    case 'strong':
      return 'Tama aihe pysyy hyvin muistissa.'
    case 'mid':
      return 'Yksi lisakierros tekee osaamisesta varmempaa.'
    default:
      return 'Aloita kertaus taman aiheen korteista.'
  }
}

export function buildTopicMasteryItems(
  stats: Record<string, TopicMasterySourceStat>,
  flashcardSetCode?: string | null
): TopicMasteryItem[] {
  const entries = Object.entries(stats)
    .filter(([, value]) => value.total > 0)
    .map(([topic, value]) => {
      const level = getTopicMasteryLevel(value.percentage);
      const reviewHref =
        flashcardSetCode && level === 'weak'
          ? `/play/${flashcardSetCode}?mode=opettele&topic=${encodeURIComponent(topic)}`
          : null;

      return {
        topic,
        correct: value.correct,
        total: value.total,
        percentage: value.percentage,
        level,
        statusLabel: getTopicMasteryStatusLabel(level),
        guidance: getTopicMasteryGuidance(level),
        reviewHref,
      };
    });

  return entries.sort((left, right) => {
    const levelOrder: Record<TopicMasteryLevel, number> = {
      weak: 0,
      mid: 1,
      strong: 2,
    };

    const levelDelta = levelOrder[left.level] - levelOrder[right.level];
    if (levelDelta !== 0) {
      return levelDelta;
    }

    if (left.percentage !== right.percentage) {
      return left.percentage - right.percentage;
    }

    return left.topic.localeCompare(right.topic, 'fi-FI');
  });
}

export function getPrimaryWeakTopicHref(items: TopicMasteryItem[]): string | null {
  return items.find((item) => item.reviewHref)?.reviewHref ?? null;
}

export function getNewlyUnlockedBadges<TBadge extends { id: string }>(
  badges: TBadge[],
  newlyUnlocked: string[]
): TBadge[] {
  if (newlyUnlocked.length === 0) {
    return [];
  }

  const unlockedIds = new Set(newlyUnlocked);
  return badges.filter((badge) => unlockedIds.has(badge.id));
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
