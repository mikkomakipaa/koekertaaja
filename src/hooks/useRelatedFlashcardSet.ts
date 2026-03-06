import { useEffect, useState } from 'react';

export type RelatedFlashcardSetState = {
  flashcardCode: string | null;
  isLoading: boolean;
};

type RelatedFlashcardResponse = {
  data?: {
    relatedFlashcardCode?: string | null;
  };
};

export function getInitialRelatedFlashcardSetState(questionSetCode?: string): RelatedFlashcardSetState {
  if (!questionSetCode?.trim()) {
    return {
      flashcardCode: null,
      isLoading: false,
    };
  }

  return {
    flashcardCode: null,
    isLoading: true,
  };
}

export async function fetchRelatedFlashcardSetState(
  questionSetCode?: string,
  fetchImpl: typeof fetch = fetch
): Promise<RelatedFlashcardSetState> {
  if (!questionSetCode?.trim()) {
    return {
      flashcardCode: null,
      isLoading: false,
    };
  }

  try {
    const response = await fetchImpl(
      `/api/question-sets?code=${encodeURIComponent(questionSetCode)}&relatedFlashcard=1`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return {
        flashcardCode: null,
        isLoading: false,
      };
    }

    const payload = (await response.json()) as RelatedFlashcardResponse;
    const relatedCode = payload.data?.relatedFlashcardCode;

    return {
      flashcardCode:
        typeof relatedCode === 'string' && relatedCode.trim().length > 0
          ? relatedCode
          : null,
      isLoading: false,
    };
  } catch {
    return {
      flashcardCode: null,
      isLoading: false,
    };
  }
}

export function useRelatedFlashcardSet(questionSetCode?: string): RelatedFlashcardSetState {
  const [state, setState] = useState<RelatedFlashcardSetState>(() =>
    getInitialRelatedFlashcardSetState(questionSetCode)
  );

  useEffect(() => {
    let cancelled = false;

    if (!questionSetCode?.trim()) {
      setState({
        flashcardCode: null,
        isLoading: false,
      });
      return () => {
        cancelled = true;
      };
    }

    setState({
      flashcardCode: null,
      isLoading: true,
    });

    void fetchRelatedFlashcardSetState(questionSetCode).then((nextState) => {
      if (cancelled) return;
      setState(nextState);
    });

    return () => {
      cancelled = true;
    };
  }, [questionSetCode]);

  return state;
}
