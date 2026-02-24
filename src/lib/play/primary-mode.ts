import type { BrowseDifficulty } from '@/lib/play/browse-difficulties';

export interface DifficultyScoreSnapshot {
  score: number;
  total: number;
  percentage: number;
  timestamp: number;
}

export type DifficultyScoreMap = Partial<Record<BrowseDifficulty, DifficultyScoreSnapshot | null>>;

const primaryDifficultyOrder: BrowseDifficulty[] = ['normaali', 'helppo', 'aikahaaste'];

const sortByPreferredDifficulty = (a: BrowseDifficulty, b: BrowseDifficulty) =>
  primaryDifficultyOrder.indexOf(a) - primaryDifficultyOrder.indexOf(b);

const sortByTimestampDesc = (
  a: { difficulty: BrowseDifficulty; timestamp: number },
  b: { difficulty: BrowseDifficulty; timestamp: number }
) => {
  if (b.timestamp === a.timestamp) {
    return sortByPreferredDifficulty(a.difficulty, b.difficulty);
  }
  return b.timestamp - a.timestamp;
};

const sortByPercentageDesc = (
  a: { difficulty: BrowseDifficulty; percentage: number; timestamp: number },
  b: { difficulty: BrowseDifficulty; percentage: number; timestamp: number }
) => {
  if (b.percentage === a.percentage) {
    return sortByTimestampDesc(a, b);
  }
  return b.percentage - a.percentage;
};

export const getPrimaryDifficulty = (
  availableDifficulties: BrowseDifficulty[],
  difficultyScores: DifficultyScoreMap
): BrowseDifficulty => {
  const scoreEntries = availableDifficulties
    .map((difficulty) => ({
      difficulty,
      score: difficultyScores[difficulty],
    }))
    .filter(
      (entry): entry is { difficulty: BrowseDifficulty; score: DifficultyScoreSnapshot } =>
        Boolean(entry.score)
    );

  const recentEntries = scoreEntries.filter((entry) => Number.isFinite(entry.score.timestamp));
  if (recentEntries.length > 0) {
    const mostRecent = [...recentEntries].sort((a, b) =>
      sortByTimestampDesc(
        { difficulty: a.difficulty, timestamp: a.score.timestamp },
        { difficulty: b.difficulty, timestamp: b.score.timestamp }
      )
    )[0];
    return mostRecent.difficulty;
  }

  const bestScore = scoreEntries
    .map((entry) => ({
      difficulty: entry.difficulty,
      percentage: entry.score.percentage,
      timestamp: entry.score.timestamp,
    }))
    .sort(sortByPercentageDesc)[0];

  if (bestScore) {
    return bestScore.difficulty;
  }

  if (availableDifficulties.includes('normaali')) {
    return 'normaali';
  }

  return availableDifficulties[0] ?? 'normaali';
};

export const getLatestDifficultyScore = (
  availableDifficulties: BrowseDifficulty[],
  difficultyScores: DifficultyScoreMap
): { difficulty: BrowseDifficulty; score: DifficultyScoreSnapshot } | null => {
  const latest = availableDifficulties
    .map((difficulty) => ({
      difficulty,
      score: difficultyScores[difficulty],
    }))
    .filter(
      (entry): entry is { difficulty: BrowseDifficulty; score: DifficultyScoreSnapshot } =>
        Boolean(entry.score)
    )
    .sort((a, b) => sortByTimestampDesc({ difficulty: a.difficulty, timestamp: a.score.timestamp }, {
      difficulty: b.difficulty,
      timestamp: b.score.timestamp,
    }))[0];

  return latest ?? null;
};
