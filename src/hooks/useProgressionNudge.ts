import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useHighScoreStreak } from '@/hooks/useHighScoreStreak';

export type ProgressionNudgeFetchState = {
  normaaliCode: string | null;
  isLoading: boolean;
};

type RelatedNormalResponse = {
  data?: {
    relatedNormalCode?: string | null;
  };
};

function normalizeQuestionSetCode(questionSetCode?: string): string | null {
  const trimmed = questionSetCode?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function getProgressionPercentage(score?: number, total?: number): number | null {
  if (typeof score !== 'number' || typeof total !== 'number' || total <= 0) {
    return null;
  }

  return Math.round((score / total) * 100);
}

export function shouldIncrementProgressionNudge(
  difficulty?: string,
  score?: number,
  total?: number
): boolean {
  const percentage = getProgressionPercentage(score, total);
  return difficulty === 'helppo' && typeof percentage === 'number' && percentage >= 80;
}

export function shouldShowProgressionNudge(
  difficulty: string | undefined,
  count: number,
  nudgeDismissed: boolean
): boolean {
  return difficulty === 'helppo' && count >= 2 && !nudgeDismissed;
}

export function getInitialProgressionNudgeFetchState(
  shouldNudge: boolean,
  questionSetCode?: string
): ProgressionNudgeFetchState {
  if (!shouldNudge || !normalizeQuestionSetCode(questionSetCode)) {
    return {
      normaaliCode: null,
      isLoading: false,
    };
  }

  return {
    normaaliCode: null,
    isLoading: true,
  };
}

export async function fetchProgressionNudgeState(
  questionSetCode?: string,
  fetchImpl: typeof fetch = fetch
): Promise<ProgressionNudgeFetchState> {
  const normalizedCode = normalizeQuestionSetCode(questionSetCode);

  if (!normalizedCode) {
    return {
      normaaliCode: null,
      isLoading: false,
    };
  }

  try {
    const response = await fetchImpl(
      `/api/question-sets?code=${encodeURIComponent(normalizedCode)}&relatedNormal=1`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return {
        normaaliCode: null,
        isLoading: false,
      };
    }

    const payload = (await response.json()) as RelatedNormalResponse;
    const relatedCode = payload.data?.relatedNormalCode;

    return {
      normaaliCode:
        typeof relatedCode === 'string' && relatedCode.trim().length > 0
          ? relatedCode
          : null,
      isLoading: false,
    };
  } catch {
    return {
      normaaliCode: null,
      isLoading: false,
    };
  }
}

export function useProgressionNudge(
  code?: string,
  difficulty?: string,
  score?: number,
  total?: number
) {
  const { count, nudgeDismissed, increment, dismiss } = useHighScoreStreak(code);
  const [state, setState] = useState<ProgressionNudgeFetchState>(() =>
    getInitialProgressionNudgeFetchState(false, code)
  );
  const lastIncrementKeyRef = useRef<string | null>(null);

  const percentage = useMemo(
    () => getProgressionPercentage(score, total),
    [score, total]
  );
  const shouldIncrement = useMemo(
    () => shouldIncrementProgressionNudge(difficulty, score, total),
    [difficulty, score, total]
  );

  useEffect(() => {
    const normalizedCode = normalizeQuestionSetCode(code);
    const incrementKey =
      normalizedCode && shouldIncrement && typeof percentage === 'number'
        ? `${normalizedCode}:${difficulty ?? ''}:${score ?? ''}:${total ?? ''}`
        : null;

    if (!incrementKey || lastIncrementKeyRef.current === incrementKey) {
      return;
    }

    if (typeof percentage !== 'number') {
      return;
    }

    lastIncrementKeyRef.current = incrementKey;
    increment(difficulty, percentage);
  }, [code, difficulty, increment, percentage, score, shouldIncrement, total]);

  const shouldNudge = useMemo(
    () => shouldShowProgressionNudge(difficulty, count, nudgeDismissed),
    [count, difficulty, nudgeDismissed]
  );

  useEffect(() => {
    let cancelled = false;

    const initialState = getInitialProgressionNudgeFetchState(shouldNudge, code);
    setState(initialState);

    if (!initialState.isLoading) {
      return () => {
        cancelled = true;
      };
    }

    void fetchProgressionNudgeState(code).then((nextState) => {
      if (cancelled) return;
      setState(nextState);
    });

    return () => {
      cancelled = true;
    };
  }, [code, shouldNudge]);

  const handleDismiss = useCallback(() => {
    dismiss();
  }, [dismiss]);

  return {
    shouldNudge,
    normaaliCode: state.normaaliCode,
    isLoading: state.isLoading,
    dismiss: handleDismiss,
  };
}
