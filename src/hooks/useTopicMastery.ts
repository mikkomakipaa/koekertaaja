import { useCallback } from 'react';
import { createLogger } from '@/lib/logger';
import {
  getTopicMasteryStorageKey,
  normalizeTopicMasteryStats,
  readTopicMasteryFromStorage,
} from '@/lib/mindMap/storage';
import { normalizeTopicLabel } from '@/lib/topics/normalization';
import type { TopicMasteryStats } from '@/types/mindMap';

export { getTopicMasteryStorageKey, readTopicMasteryFromStorage } from '@/lib/mindMap/storage';

export interface TopicMasteryRecord {
  [topic: string]: {
    correct: number;
    total: number;
    percentage: number;
  };
}

const STORAGE_EVENT = 'topic-mastery-updated';
const logger = createLogger({ module: 'useTopicMastery' });

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};

export const writeTopicMasteryToStorage = (
  questionSetCode: string | undefined,
  stats: Record<string, TopicMasteryStats>
): boolean => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if (!storageKey) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.setItem(storageKey, JSON.stringify(normalizeTopicMasteryStats(stats)));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }));
    }
    return true;
  } catch (error) {
    logger.warn({ error }, 'Unable to persist topic mastery to storage');
    return false;
  }
};

export const clearTopicMasteryFromStorage = (questionSetCode?: string): boolean => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if (!storageKey) return false;

  const storage = getStorage();
  if (!storage) return false;

  try {
    storage.removeItem(storageKey);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: { key: storageKey } }));
    }
    return true;
  } catch (error) {
    logger.warn({ error }, 'Unable to clear topic mastery from storage');
    return false;
  }
};

const buildTopicMasteryRecord = (stats: Record<string, TopicMasteryStats>): TopicMasteryRecord => {
  const withPercentages: TopicMasteryRecord = {};

  for (const [topic, rawStats] of Object.entries(stats)) {
    const normalizedTopic = normalizeTopicLabel(topic);
    if (!normalizedTopic) continue;

    const total = rawStats.total > 0 ? rawStats.total : 0;
    const correct = rawStats.correct > 0 ? rawStats.correct : 0;
    const existing = withPercentages[normalizedTopic];
    const mergedCorrect = (existing?.correct ?? 0) + correct;
    const mergedTotal = (existing?.total ?? 0) + total;
    const percentage = mergedTotal > 0 ? Math.round((mergedCorrect / mergedTotal) * 100) : 0;

    withPercentages[normalizedTopic] = {
      correct: mergedCorrect,
      total: mergedTotal,
      percentage,
    };
  }

  return withPercentages;
};

export const getTopicMasteryStats = (questionSetCode?: string): TopicMasteryRecord => {
  const stats = readTopicMasteryFromStorage(questionSetCode);
  return buildTopicMasteryRecord(stats);
};

export const updateTopicMasteryInStorage = (
  questionSetCode: string | undefined,
  topic: string | undefined,
  isCorrect: boolean
): TopicMasteryRecord | null => {
  const storageKey = getTopicMasteryStorageKey(questionSetCode);
  if (!storageKey) return null;

  const normalizedTopic = typeof topic === 'string' ? normalizeTopicLabel(topic) : '';
  if (!normalizedTopic) return null;

  const current = readTopicMasteryFromStorage(questionSetCode);

  if (!current[normalizedTopic]) {
    current[normalizedTopic] = { correct: 0, total: 0 };
  }

  current[normalizedTopic].total += 1;
  if (isCorrect) {
    current[normalizedTopic].correct += 1;
  }

  const success = writeTopicMasteryToStorage(questionSetCode, current);
  if (!success) return null;

  return buildTopicMasteryRecord(current);
};

export function useTopicMastery(questionSetCode?: string) {
  const getMasteryStats = useCallback(() => getTopicMasteryStats(questionSetCode), [questionSetCode]);

  const updateMastery = useCallback((topic: string | undefined, isCorrect: boolean) => {
    updateTopicMasteryInStorage(questionSetCode, topic, isCorrect);
  }, [questionSetCode]);

  const clearMastery = useCallback(() => {
    clearTopicMasteryFromStorage(questionSetCode);
  }, [questionSetCode]);

  const hasMasteryData = useCallback(() => {
    const stats = readTopicMasteryFromStorage(questionSetCode);
    return Object.keys(stats).length > 0;
  }, [questionSetCode]);

  return {
    getMasteryStats,
    updateMastery,
    clearMastery,
    hasMasteryData,
  };
}
