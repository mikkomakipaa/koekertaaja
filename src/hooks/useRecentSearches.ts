import { useCallback, useEffect, useState } from 'react';

const RECENT_SEARCHES_KEY = 'koekertaaja:recentSearches';
const DEFAULT_LIMIT = 5;

const getStorage = (): Storage | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  const fallback = (globalThis as { localStorage?: Storage }).localStorage;
  return fallback ?? null;
};

export const getRecentSearches = (): string[] => {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
};

const storeRecentSearches = (items: string[]) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
};

export const addRecentSearch = (value: string, limit = DEFAULT_LIMIT): string[] => {
  const trimmed = value.trim();
  if (!trimmed) return getRecentSearches();

  const existing = getRecentSearches();
  const normalized = trimmed.toLowerCase();
  const next = [trimmed, ...existing.filter((item) => item.toLowerCase() !== normalized)].slice(0, limit);
  storeRecentSearches(next);
  return next;
};

export const clearRecentSearches = () => {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(RECENT_SEARCHES_KEY);
};

export function useRecentSearches(limit = DEFAULT_LIMIT) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  const add = useCallback(
    (value: string) => {
      setRecentSearches(addRecentSearch(value, limit));
    },
    [limit]
  );

  const clear = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return { recentSearches, addRecentSearch: add, clearRecentSearches: clear };
}
