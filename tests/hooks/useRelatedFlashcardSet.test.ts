import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import {
  fetchRelatedFlashcardSetState,
  getInitialRelatedFlashcardSetState,
} from '@/hooks/useRelatedFlashcardSet';

describe('useRelatedFlashcardSet helpers', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns loading initial state and then a found flashcard code', async () => {
    let fetchCalls = 0;
    globalThis.fetch = (async (input: string | URL | Request) => {
      fetchCalls += 1;
      assert.equal(String(input), '/api/question-sets?code=QUIZ123&relatedFlashcard=1');
      return {
        ok: true,
        json: async () => ({
          data: {
            relatedFlashcardCode: 'FLASH123',
          },
        }),
      } as Response;
    }) as typeof fetch;

    assert.deepEqual(getInitialRelatedFlashcardSetState('QUIZ123'), {
      flashcardCode: null,
      isLoading: true,
    });

    const resolved = await fetchRelatedFlashcardSetState('QUIZ123');

    assert.equal(fetchCalls, 1);
    assert.deepEqual(resolved, {
      flashcardCode: 'FLASH123',
      isLoading: false,
    });
  });

  it('returns null flashcard code when API has no sibling set', async () => {
    globalThis.fetch = (async () => {
      return {
        ok: true,
        json: async () => ({
          data: {
            relatedFlashcardCode: null,
          },
        }),
      } as Response;
    }) as typeof fetch;

    assert.deepEqual(getInitialRelatedFlashcardSetState('QUIZ404'), {
      flashcardCode: null,
      isLoading: true,
    });

    const resolved = await fetchRelatedFlashcardSetState('QUIZ404');

    assert.deepEqual(resolved, {
      flashcardCode: null,
      isLoading: false,
    });
  });

  it('returns null flashcard code when fetch fails', async () => {
    globalThis.fetch = (async () => {
      throw new Error('network error');
    }) as typeof fetch;

    assert.deepEqual(getInitialRelatedFlashcardSetState('QUIZERR'), {
      flashcardCode: null,
      isLoading: true,
    });

    const resolved = await fetchRelatedFlashcardSetState('QUIZERR');

    assert.deepEqual(resolved, {
      flashcardCode: null,
      isLoading: false,
    });
  });

  it('does not fetch when questionSetCode is empty', async () => {
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return {
        ok: true,
        json: async () => ({ data: {} }),
      } as Response;
    }) as typeof fetch;

    assert.deepEqual(getInitialRelatedFlashcardSetState(undefined), {
      flashcardCode: null,
      isLoading: false,
    });

    const resolved = await fetchRelatedFlashcardSetState(undefined);

    assert.equal(fetchCalls, 0);
    assert.deepEqual(resolved, {
      flashcardCode: null,
      isLoading: false,
    });
  });
});
