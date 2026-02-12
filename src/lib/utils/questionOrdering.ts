import { createLogger } from '@/lib/logger';
import type { Difficulty, Question } from '@/types';

const logger = createLogger({ module: 'questionOrdering' });

type CognitiveType = 'recall' | 'apply' | 'analyze' | 'create';

type QuestionWithMetadata = Question & {
  difficultyScore: number;
  topicGroup: string;
  cognitiveType: CognitiveType;
};

interface OrchestrationOptions {
  expectedDifficulty?: Difficulty;
}

interface QuestionOrderingQuality {
  difficultyProgression: number;
  topicCoherence: number;
  cognitiveVariety: number;
  overallScore: number;
}

export function orchestrateQuestionSet(
  questions: Question[],
  options: OrchestrationOptions = {}
): Question[] {
  if (questions.length <= 1) {
    return questions;
  }

  logger.info(
    { count: questions.length, expectedDifficulty: options.expectedDifficulty },
    'Orchestrating question set'
  );

  const questionsWithMeta = questions.map((question) => addMetadata(question, options.expectedDifficulty));
  const topicGroups = groupByTopic(questionsWithMeta);
  const sortedGroups = topicGroups.map((group) => sortByDifficulty(group));
  const orderedGroups = orderTopicGroups(sortedGroups);
  const flattened = flattenWithProgression(orderedGroups);
  const withRecovery = insertRecoveryQuestions(flattened);
  const finalOrder = enforceHardStreakLimit(withRecovery, 3);

  validateOrder(finalOrder);

  return finalOrder.map(stripMetadata);
}

export function analyzeQuestionSetQuality(questions: Question[]): QuestionOrderingQuality {
  if (questions.length <= 1) {
    return {
      difficultyProgression: 1,
      topicCoherence: 1,
      cognitiveVariety: 0.25,
      overallScore: 0.75,
    };
  }

  const withMeta = questions.map((question) => addMetadata(question));

  let progressionTransitions = 0;
  for (let i = 1; i < withMeta.length; i += 1) {
    const diff = withMeta[i].difficultyScore - withMeta[i - 1].difficultyScore;
    if (diff >= 0 && diff <= 1) {
      progressionTransitions += 1;
    }
  }
  const difficultyProgression = progressionTransitions / (withMeta.length - 1);

  const topicChanges = withMeta.slice(1).filter((question, index) => {
    return question.topicGroup !== withMeta[index].topicGroup;
  }).length;
  const topicCoherence = 1 - (topicChanges / Math.max(1, withMeta.length - 1));

  const cognitiveTypes = new Set(withMeta.map((question) => question.cognitiveType));
  const cognitiveVariety = cognitiveTypes.size / 4;

  const overallScore = (difficultyProgression + topicCoherence + cognitiveVariety) / 3;

  return {
    difficultyProgression,
    topicCoherence,
    cognitiveVariety,
    overallScore,
  };
}

function addMetadata(question: Question, expectedDifficulty?: Difficulty): QuestionWithMetadata {
  return {
    ...question,
    difficultyScore: getDifficultyScore(question, expectedDifficulty),
    topicGroup: getTopicGroup(question.topic),
    cognitiveType: inferCognitiveType(question),
  };
}

function getDifficultyScore(question: Question, expectedDifficulty?: Difficulty): number {
  const explicitDifficulty = (question as Question & { difficulty?: string }).difficulty;
  const explicitScore = mapDifficultyToScore(explicitDifficulty);
  if (explicitScore !== null) {
    return explicitScore;
  }

  const heuristicScore = inferDifficultyScore(question);
  if (heuristicScore !== null) {
    return heuristicScore;
  }

  const expectedScore = mapDifficultyToScore(expectedDifficulty);
  return expectedScore ?? 2;
}

function mapDifficultyToScore(difficulty?: string): number | null {
  switch ((difficulty || '').toLowerCase()) {
    case 'helppo':
      return 1;
    case 'normaali':
      return 2;
    case 'vaikea':
      return 3;
    default:
      return null;
  }
}

function inferDifficultyScore(question: Question): number {
  const text = question.question_text.toLowerCase();
  let score = 1;

  if (question.question_type === 'matching' || question.question_type === 'multiple_choice') {
    score += 1;
  }

  if (question.question_type === 'sequential') {
    score += 2;
  }

  if (text.includes('miksi') || text.includes('perustele') || text.includes('vertaa') || text.includes('analysoi')) {
    score += 1;
  }

  if (text.includes('laske') && text.includes('useassa vaiheessa')) {
    score += 1;
  }

  if (question.question_text.length > 120) {
    score += 1;
  }

  return Math.max(1, Math.min(3, score));
}

function getTopicGroup(topic?: string): string {
  if (!topic) {
    return 'unknown';
  }

  const normalized = topic.toLowerCase();

  if (normalized.includes('aritmetiikka') || normalized.includes('laskutoimitus')) {
    return 'arithmetic';
  }

  if (normalized.includes('geometria') || normalized.includes('pinta-ala') || normalized.includes('piiri')) {
    return 'geometry';
  }

  if (normalized.includes('murtoluku') || normalized.includes('desimaal')) {
    return 'fractions';
  }

  const firstWord = normalized.split(/\s+/).filter(Boolean)[0];
  return firstWord || normalized;
}

function inferCognitiveType(question: Question): CognitiveType {
  const text = question.question_text.toLowerCase();

  if (
    text.startsWith('mikä on') ||
    text.startsWith('määrittele') ||
    text.startsWith('what is') ||
    text.startsWith('define')
  ) {
    return 'recall';
  }

  if (
    text.includes('miksi') ||
    text.includes('perustele') ||
    text.includes('vertaa') ||
    text.includes('analysoi') ||
    text.includes('why') ||
    text.includes('compare')
  ) {
    return 'analyze';
  }

  if (text.includes('luo') || text.includes('kirjoita') || text.includes('create') || text.includes('write')) {
    return 'create';
  }

  return 'apply';
}

function groupByTopic(questions: QuestionWithMetadata[]): QuestionWithMetadata[][] {
  const grouped = new Map<string, QuestionWithMetadata[]>();

  for (const question of questions) {
    const currentGroup = grouped.get(question.topicGroup) ?? [];
    currentGroup.push(question);
    grouped.set(question.topicGroup, currentGroup);
  }

  return Array.from(grouped.values());
}

function sortByDifficulty(questions: QuestionWithMetadata[]): QuestionWithMetadata[] {
  return [...questions].sort((a, b) => {
    if (a.difficultyScore !== b.difficultyScore) {
      return a.difficultyScore - b.difficultyScore;
    }

    const cognitiveOrder = getCognitiveOrder(a.cognitiveType) - getCognitiveOrder(b.cognitiveType);
    if (cognitiveOrder !== 0) {
      return cognitiveOrder;
    }

    return a.question_text.localeCompare(b.question_text, 'fi');
  });
}

function getCognitiveOrder(cognitiveType: CognitiveType): number {
  switch (cognitiveType) {
    case 'recall':
      return 1;
    case 'apply':
      return 2;
    case 'analyze':
      return 3;
    case 'create':
      return 4;
    default:
      return 99;
  }
}

function orderTopicGroups(groups: QuestionWithMetadata[][]): QuestionWithMetadata[][] {
  return [...groups].sort((groupA, groupB) => {
    const avgA = groupA.reduce((sum, question) => sum + question.difficultyScore, 0) / groupA.length;
    const avgB = groupB.reduce((sum, question) => sum + question.difficultyScore, 0) / groupB.length;

    if (avgA !== avgB) {
      return avgA - avgB;
    }

    return groupB.length - groupA.length;
  });
}

function flattenWithProgression(groups: QuestionWithMetadata[][]): QuestionWithMetadata[] {
  const all = groups.flat();
  const easy = all.filter((question) => question.difficultyScore === 1);
  const normal = all.filter((question) => question.difficultyScore === 2);
  const hard = all.filter((question) => question.difficultyScore === 3);

  const ordered: QuestionWithMetadata[] = [];
  const warmupTarget = Math.ceil(all.length * 0.3);
  const warmupCount = Math.min(3, easy.length, warmupTarget);

  ordered.push(...easy.slice(0, warmupCount));
  const remainingEasy = easy.slice(warmupCount);

  ordered.push(...interleave(remainingEasy, normal));
  ordered.push(...hard);

  if (ordered.length !== all.length) {
    const orderedIds = new Set(ordered.map((question) => question.id));
    const missing = all.filter((question) => !orderedIds.has(question.id));
    ordered.push(...missing);
  }

  return ordered;
}

function interleave<T>(left: T[], right: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(left.length, right.length);

  for (let i = 0; i < max; i += 1) {
    if (i < left.length) {
      result.push(left[i]);
    }
    if (i < right.length) {
      result.push(right[i]);
    }
  }

  return result;
}

function insertRecoveryQuestions(questions: QuestionWithMetadata[]): QuestionWithMetadata[] {
  const result = [...questions];
  let consecutiveHard = 0;

  for (let i = 0; i < result.length - 1; i += 1) {
    const current = result[i];

    if (current.difficultyScore === 3) {
      consecutiveHard += 1;
    } else {
      consecutiveHard = 0;
    }

    if (consecutiveHard < 2) {
      continue;
    }

    const next = result[i + 1];
    if (next.difficultyScore < 3) {
      continue;
    }

    const easierIndex = findNextEasierQuestion(result, i + 2);
    if (easierIndex === -1) {
      continue;
    }

    const [recovery] = result.splice(easierIndex, 1);
    result.splice(i + 1, 0, recovery);
    consecutiveHard = 0;

    logger.debug({ position: i + 1 }, 'Inserted recovery question');
  }

  return result;
}

function findNextEasierQuestion(questions: QuestionWithMetadata[], fromIndex: number): number {
  for (let i = fromIndex; i < questions.length; i += 1) {
    if (questions[i].difficultyScore < 3) {
      return i;
    }
  }
  return -1;
}

function enforceHardStreakLimit(
  questions: QuestionWithMetadata[],
  maxAllowedStreak: number
): QuestionWithMetadata[] {
  if (questions.length === 0) {
    return questions;
  }

  const result = [...questions];
  let currentStreak = 0;

  for (let i = 0; i < result.length; i += 1) {
    const current = result[i];

    if (current.difficultyScore !== 3) {
      currentStreak = 0;
      continue;
    }

    currentStreak += 1;
    if (currentStreak <= maxAllowedStreak) {
      continue;
    }

    const easierIndex = findNextEasierQuestion(result, i + 1);
    if (easierIndex !== -1) {
      const [recovery] = result.splice(easierIndex, 1);
      result.splice(i, 0, recovery);
      currentStreak = 0;
      continue;
    }

    // No easier question ahead. Reuse one from earlier positions to split the streak.
    const earlierEasierIndex = findEarlierEasierQuestion(result, i - currentStreak + 1);
    if (earlierEasierIndex === -1) {
      continue;
    }

    const [recovery] = result.splice(earlierEasierIndex, 1);
    const insertAt = Math.max(0, i - 1);
    result.splice(insertAt, 0, recovery);
    currentStreak = 0;
  }

  return result;
}

function findEarlierEasierQuestion(
  questions: QuestionWithMetadata[],
  beforeIndex: number
): number {
  for (let i = beforeIndex - 1; i >= 0; i -= 1) {
    if (questions[i].difficultyScore < 3) {
      return i;
    }
  }
  return -1;
}

function validateOrder(questions: QuestionWithMetadata[]): void {
  if (questions.length === 0) {
    return;
  }

  if (questions[0].difficultyScore === 3) {
    logger.warn('First question is hard (difficulty 3), warm-up may be too difficult');
  }

  let maxConsecutiveHard = 0;
  let streak = 0;
  for (const question of questions) {
    if (question.difficultyScore === 3) {
      streak += 1;
      maxConsecutiveHard = Math.max(maxConsecutiveHard, streak);
    } else {
      streak = 0;
    }
  }

  if (maxConsecutiveHard > 3) {
    logger.warn({ maxStreak: maxConsecutiveHard }, 'Long hard-question streak detected');
  }

  const easyCount = questions.filter((question) => question.difficultyScore === 1).length;
  const normalCount = questions.filter((question) => question.difficultyScore === 2).length;
  const hardCount = questions.filter((question) => question.difficultyScore === 3).length;

  logger.info(
    { easy: easyCount, normal: normalCount, hard: hardCount },
    'Final difficulty distribution'
  );

  const warmupSection = questions.slice(0, Math.ceil(questions.length * 0.3));
  const warmupEasyCount = warmupSection.filter((question) => question.difficultyScore === 1).length;
  if (warmupEasyCount < 2 && easyCount >= 2) {
    logger.warn({ warmupEasyCount }, 'Warm-up contains fewer easy questions than expected');
  }
}

function stripMetadata(question: QuestionWithMetadata): Question {
  const { difficultyScore, topicGroup, cognitiveType, ...clean } = question;
  return clean as Question;
}
