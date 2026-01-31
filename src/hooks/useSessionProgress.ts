import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/logger';

export interface SessionProgress {
  answered: number;
  total: number;
  percentage: number;
}

const buildKey = (questionSetCode: string) => `session_progress_${questionSetCode}`;
const logger = createLogger({ module: 'useSessionProgress' });

export function useSessionProgress(questionSetCode?: string) {
  const [progress, setProgress] = useState<SessionProgress | null>(null);

  const storageKey = useMemo(
    () => (questionSetCode ? buildKey(questionSetCode) : null),
    [questionSetCode]
  );

  useEffect(() => {
    if (!storageKey) {
      setProgress(null);
      return;
    }

    try {
      const stored = localStorage.getItem(storageKey);

      if (!stored) {
        setProgress(null);
        return;
      }

      const data = JSON.parse(stored) as Partial<SessionProgress>;

      if (typeof data.answered === 'number' && typeof data.total === 'number' && data.total > 0) {
        const answered = Math.min(Math.max(data.answered, 0), data.total);
        const percentage = Math.round((answered / data.total) * 100);
        setProgress({ answered, total: data.total, percentage });
      } else {
        setProgress(null);
      }
    } catch (error) {
      logger.error({ error }, 'Error reading session progress');
      setProgress(null);
    }
  }, [storageKey]);

  const updateProgress = useCallback(
    (answered: number, total: number) => {
      if (!storageKey || total <= 0) return;

      const safeAnswered = Math.min(Math.max(answered, 0), total);
      const percentage = Math.round((safeAnswered / total) * 100);
      const data: SessionProgress = { answered: safeAnswered, total, percentage };

      try {
        localStorage.setItem(storageKey, JSON.stringify({ answered: safeAnswered, total }));
        setProgress(data);
      } catch (error) {
        logger.error({ error }, 'Error updating session progress');
      }
    },
    [storageKey]
  );

  const clearProgress = useCallback(() => {
    if (!storageKey) return;

    try {
      localStorage.removeItem(storageKey);
      setProgress(null);
    } catch (error) {
      logger.error({ error }, 'Error clearing session progress');
    }
  }, [storageKey]);

  return {
    progress,
    updateProgress,
    clearProgress,
  };
}
