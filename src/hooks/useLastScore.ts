import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/logger';

export interface LastScore {
  score: number;
  total: number;
  percentage: number;
  timestamp: number;
  difficulty?: string;
}

const buildKey = (questionSetCode: string) => `last_score_${questionSetCode}`;
const logger = createLogger({ module: 'useLastScore' });

export function useLastScore(questionSetCode?: string) {
  const [lastScore, setLastScore] = useState<LastScore | null>(null);

  const storageKey = useMemo(
    () => (questionSetCode ? buildKey(questionSetCode) : null),
    [questionSetCode]
  );

  useEffect(() => {
    if (!storageKey) {
      setLastScore(null);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        setLastScore(null);
        return;
      }

      const data = JSON.parse(stored) as Partial<LastScore>;

      if (
        typeof data.score === 'number' &&
        typeof data.total === 'number' &&
        typeof data.timestamp === 'number'
      ) {
        const percentage =
          typeof data.percentage === 'number'
            ? data.percentage
            : Math.round((data.score / data.total) * 100);

        setLastScore({
          score: data.score,
          total: data.total,
          timestamp: data.timestamp,
          difficulty: data.difficulty,
          percentage,
        });
      } else {
        setLastScore(null);
      }
    } catch (error) {
      logger.error({ error }, 'Error reading last score');
      setLastScore(null);
    }
  }, [storageKey]);

  const saveLastScore = useCallback(
    (score: number, total: number, difficulty?: string) => {
      if (!storageKey || total <= 0) return;

      const percentage = Math.round((score / total) * 100);
      const data: LastScore = {
        score,
        total,
        percentage,
        timestamp: Date.now(),
        difficulty,
      };

      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setLastScore(data);
      } catch (error) {
        logger.error({ error }, 'Error saving last score');
      }
    },
    [storageKey]
  );

  const clearLastScore = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setLastScore(null);
    } catch (error) {
      logger.error({ error }, 'Error clearing last score');
    }
  }, [storageKey]);

  return {
    lastScore,
    saveLastScore,
    clearLastScore,
  };
}
