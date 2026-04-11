import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';

export interface SelectedSchool {
  schoolId: string;
  schoolName: string;
}

interface SelectedSchoolState {
  schoolId: string | null;
  schoolName: string | null;
  isLoaded: boolean;
}

const SELECTED_SCHOOL_STORAGE_KEY = 'kk_selected_school';
const logger = createLogger({ module: 'useSelectedSchool' });

const EMPTY_STATE: SelectedSchoolState = {
  schoolId: null,
  schoolName: null,
  isLoaded: false,
};

const getStorage = (): Storage | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (error) {
    logger.warn({ error }, 'Unable to access window.localStorage');
  }

  try {
    const fallback = (globalThis as { localStorage?: Storage }).localStorage;
    return fallback ?? null;
  } catch (error) {
    logger.warn({ error }, 'Unable to access fallback localStorage');
    return null;
  }
};

const isSelectedSchool = (value: unknown): value is SelectedSchool => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<SelectedSchool>;
  return typeof candidate.schoolId === 'string' && typeof candidate.schoolName === 'string';
};

export const readSelectedSchoolFromStorage = (): SelectedSchool | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  try {
    const stored = storage.getItem(SELECTED_SCHOOL_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as unknown;
    return isSelectedSchool(parsed) ? parsed : null;
  } catch (error) {
    logger.warn({ error }, 'Unable to read selected school from storage');
    return null;
  }
};

export const writeSelectedSchoolToStorage = (
  schoolId: string,
  schoolName: string
): SelectedSchool | null => {
  const storage = getStorage();
  if (!storage) {
    return null;
  }

  const nextValue: SelectedSchool = { schoolId, schoolName };

  try {
    storage.setItem(SELECTED_SCHOOL_STORAGE_KEY, JSON.stringify(nextValue));
    return nextValue;
  } catch (error) {
    logger.warn({ error }, 'Unable to persist selected school to storage');
    return null;
  }
};

export const clearSelectedSchoolFromStorage = (): boolean => {
  const storage = getStorage();
  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(SELECTED_SCHOOL_STORAGE_KEY);
    return true;
  } catch (error) {
    logger.warn({ error }, 'Unable to clear selected school from storage');
    return false;
  }
};

export function useSelectedSchool() {
  const [state, setState] = useState<SelectedSchoolState>(EMPTY_STATE);

  useEffect(() => {
    const storedSchool = readSelectedSchoolFromStorage();

    setState({
      schoolId: storedSchool?.schoolId ?? null,
      schoolName: storedSchool?.schoolName ?? null,
      isLoaded: true,
    });
  }, []);

  const setSchool = useCallback((schoolId: string, schoolName: string) => {
    const storedSchool = writeSelectedSchoolToStorage(schoolId, schoolName);

    setState({
      schoolId: storedSchool?.schoolId ?? schoolId,
      schoolName: storedSchool?.schoolName ?? schoolName,
      isLoaded: true,
    });
  }, []);

  const clearSchool = useCallback(() => {
    clearSelectedSchoolFromStorage();

    setState({
      schoolId: null,
      schoolName: null,
      isLoaded: true,
    });
  }, []);

  return {
    schoolId: state.schoolId,
    schoolName: state.schoolName,
    setSchool,
    clearSchool,
    isLoaded: state.isLoaded,
  };
}

export { SELECTED_SCHOOL_STORAGE_KEY };
