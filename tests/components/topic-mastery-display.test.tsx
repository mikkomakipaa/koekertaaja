import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key) ?? null : null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }

  removeItem(key: string) {
    this.store.delete(key);
  }
}

describe('TopicMasteryDisplay', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
  });

  it('renders one canonical Finnish row for merged English/Finnish alias keys', () => {
    globalThis.localStorage?.setItem(
      'topic_mastery_UI_MERGE',
      JSON.stringify({
        'Nouns and Articles': { correct: 1, total: 2 },
        'Substantiivit ja artikkelit': { correct: 2, total: 3 },
      })
    );

    const html = renderToString(
      createElement(TopicMasteryDisplay, {
        questionSetCode: 'UI_MERGE',
      })
    );

    const canonicalMatches = html.match(/Substantiivit ja artikkelit/g) ?? [];
    assert.equal(canonicalMatches.length, 2);
    assert.ok(!html.includes('Nouns and Articles'));
    assert.match(html, /3(?:<!-- -->)?\/(?:<!-- -->)?5(?:<!-- -->)? oikein/);
    assert.match(html, /60(?:<!-- -->)?%/);
  });
});
