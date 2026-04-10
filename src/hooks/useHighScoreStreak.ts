import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/logger';

export interface HighScoreStreak {
  count: number;
  nudgeDismissed: boolean;
}

const logger = createLogger({ module: 'useHighScoreStreak' });

const buildKey = (questionSetCode: string) =>
  `helppo_high_score_count_${questionSetCode.toUpperCase()}`;

function isValidHighScoreStreak(data: unknown): data is HighScoreStreak {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const candidate = data as Partial<HighScoreStreak>;
  return typeof candidate.count === 'number' && typeof candidate.nudgeDismissed === 'boolean';
}

export function readHighScoreStreakFromStorage(questionSetCode?: string): HighScoreStreak | null {
  if (!questionSetCode) return null;

  try {
    const stored = localStorage.getItem(buildKey(questionSetCode));

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored) as unknown;

    if (isValidHighScoreStreak(data)) {
      return data;
    }
  } catch (error) {
    logger.error({ error }, 'Error reading high score streak');
  }

  return null;
}

export function incrementHighScoreStreakInStorage(
  questionSetCode: string | undefined,
  difficulty?: string,
  percentage?: number
): HighScoreStreak | null {
  if (!questionSetCode) return null;
  if (difficulty !== 'helppo' || typeof percentage !== 'number' || percentage < 80) {
    return readHighScoreStreakFromStorage(questionSetCode);
  }

  try {
    const nextValue: HighScoreStreak = {
      count: (readHighScoreStreakFromStorage(questionSetCode)?.count ?? 0) + 1,
      nudgeDismissed: readHighScoreStreakFromStorage(questionSetCode)?.nudgeDismissed ?? false,
    };

    localStorage.setItem(buildKey(questionSetCode), JSON.stringify(nextValue));
    return nextValue;
  } catch (error) {
    logger.error({ error }, 'Error incrementing high score streak');
    return readHighScoreStreakFromStorage(questionSetCode);
  }
}

export function dismissHighScoreStreakInStorage(
  questionSetCode?: string
): HighScoreStreak | null {
  if (!questionSetCode) return null;

  try {
    const current = readHighScoreStreakFromStorage(questionSetCode) ?? {
      count: 0,
      nudgeDismissed: false,
    };

    const nextValue: HighScoreStreak = {
      ...current,
      nudgeDismissed: true,
    };

    localStorage.setItem(buildKey(questionSetCode), JSON.stringify(nextValue));
    return nextValue;
  } catch (error) {
    logger.error({ error }, 'Error dismissing high score streak');
    return readHighScoreStreakFromStorage(questionSetCode);
  }
}

export function useHighScoreStreak(questionSetCode?: string) {
  const [streak, setStreak] = useState<HighScoreStreak | null>(null);

  const storageKey = useMemo(
    () => (questionSetCode ? buildKey(questionSetCode) : null),
    [questionSetCode]
  );

  useEffect(() => {
    if (!storageKey) {
      setStreak(null);
      return;
    }

    setStreak(readHighScoreStreakFromStorage(questionSetCode));
  }, [questionSetCode, storageKey]);

  const increment = useCallback(
    (difficulty?: string, percentage?: number) => {
      const nextValue = incrementHighScoreStreakInStorage(questionSetCode, difficulty, percentage);

      if (nextValue) {
        setStreak(nextValue);
      }
    },
    [questionSetCode]
  );

  const dismiss = useCallback(() => {
    const nextValue = dismissHighScoreStreakInStorage(questionSetCode);

    if (nextValue) {
      setStreak(nextValue);
    }
  }, [questionSetCode]);

  return {
    count: streak?.count ?? 0,
    nudgeDismissed: streak?.nudgeDismissed ?? false,
    increment,
    dismiss,
  };
}
