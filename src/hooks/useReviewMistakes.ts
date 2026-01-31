import { useCallback, useEffect, useMemo, useState } from 'react';
import { createLogger } from '@/lib/logger';

export interface MistakeRecord {
  questionId: string;
  questionText: string;
  correctAnswer: any;
  userAnswer: any;
  addedAt: number;
}

const STORAGE_EVENT = 'mistakes-updated';
const logger = createLogger({ module: 'useReviewMistakes' });

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};

export const getMistakeStorageKey = (questionSetCode?: string): string | null => {
  if (!questionSetCode) return null;
  return `mistakes_${questionSetCode}`;
};

export const readMistakesFromStorage = (questionSetCode?: string): MistakeRecord[] => {
  const storageKey = getMistakeStorageKey(questionSetCode);
  if (!storageKey) return [];

  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MistakeRecord[]) : [];
  } catch (error) {
    logger.warn({ error }, 'Unable to read review mistakes from storage');
    return [];
  }
};

export const writeMistakesToStorage = (questionSetCode: string | undefined, mistakes: MistakeRecord[]): boolean => {
  const storageKey = getMistakeStorageKey(questionSetCode);
  if (!storageKey) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(storageKey, JSON.stringify(mistakes));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }));
    }
    return true;
  } catch (error) {
    logger.warn({ error }, 'Unable to persist review mistakes to storage');
    return false;
  }
};

export const upsertMistakeInStorage = (
  questionSetCode: string | undefined,
  mistake: Omit<MistakeRecord, 'addedAt'>
): MistakeRecord[] | null => {
  const existing = readMistakesFromStorage(questionSetCode);
  const existingIndex = existing.findIndex(item => item.questionId === mistake.questionId);

  if (existingIndex >= 0) {
    const previous = existing[existingIndex];
    existing[existingIndex] = {
      ...previous,
      ...mistake,
      addedAt: previous.addedAt,
    };
  } else {
    existing.push({
      ...mistake,
      addedAt: Date.now(),
    });
  }

  return writeMistakesToStorage(questionSetCode, existing) ? existing : null;
};

export const removeMistakeFromStorage = (
  questionSetCode: string | undefined,
  questionId: string
): MistakeRecord[] | null => {
  const existing = readMistakesFromStorage(questionSetCode);
  const next = existing.filter(item => item.questionId !== questionId);
  return writeMistakesToStorage(questionSetCode, next) ? next : null;
};

export const clearMistakesFromStorage = (questionSetCode: string | undefined): boolean => {
  return writeMistakesToStorage(questionSetCode, []);
};

export function useReviewMistakes(questionSetCode?: string) {
  const storageKey = useMemo(() => getMistakeStorageKey(questionSetCode), [questionSetCode]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const refreshMistakeCount = useCallback(() => {
    const mistakes = readMistakesFromStorage(questionSetCode);
    setMistakeCount(mistakes.length);
    return mistakes;
  }, [questionSetCode]);

  useEffect(() => {
    if (!storageKey) {
      setMistakeCount(0);
      return;
    }

    refreshMistakeCount();

    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) {
        refreshMistakeCount();
      }
    };

    const handleCustom = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key === storageKey) {
        refreshMistakeCount();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(STORAGE_EVENT, handleCustom as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(STORAGE_EVENT, handleCustom as EventListener);
    };
  }, [storageKey, refreshMistakeCount]);

  const getMistakes = useCallback(() => readMistakesFromStorage(questionSetCode), [questionSetCode]);

  const addMistake = useCallback((mistake: Omit<MistakeRecord, 'addedAt'>) => {
    if (!storageKey) return;

    const updated = upsertMistakeInStorage(questionSetCode, mistake);
    if (!updated) {
      setError('Virhelistaa ei voitu tallentaa');
      return;
    }

    setError(null);
    setMistakeCount(updated.length);
  }, [questionSetCode, storageKey]);

  const removeMistake = useCallback((questionId: string) => {
    if (!storageKey) return;

    const updated = removeMistakeFromStorage(questionSetCode, questionId);
    if (!updated) {
      setError('Virhelistaa ei voitu tallentaa');
      return;
    }

    setError(null);
    setMistakeCount(updated.length);
  }, [questionSetCode, storageKey]);

  const clearMistakes = useCallback(() => {
    if (!storageKey) return;

    const success = clearMistakesFromStorage(questionSetCode);
    if (!success) {
      setError('Virhelistaa ei voitu tallentaa');
      return;
    }

    setError(null);
    setMistakeCount(0);
  }, [questionSetCode, storageKey]);

  return {
    getMistakes,
    addMistake,
    removeMistake,
    clearMistakes,
    mistakeCount,
    error,
  };
}
