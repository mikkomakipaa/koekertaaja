import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Book } from '@phosphor-icons/react';
import { PlayTopicSelector } from '@/components/play/PlayTopicSelector';

describe('PlayTopicSelector', () => {
  it('renders quiz selector copy with all-topics and per-topic rows', () => {
    const html = renderToString(
      createElement(PlayTopicSelector, {
        tone: 'quiz',
        title: 'Murtoluvut',
        subtitle: 'Mitä haluat harjoitella?',
        icon: createElement(Book, { size: 20, weight: 'duotone' }),
        onBack: () => {},
        options: [
          {
            key: 'ALL',
            title: 'Kaikki aiheet',
            description: 'Saat tehtäviä tasaisesti eri aiheista (24 kysymystä)',
            emphasized: true,
            onSelect: () => {},
          },
          {
            key: 'murtoluvut',
            title: 'Murtoluvut',
            description: 'Harjoittele vain tämän aiheen tehtäviä (12 kysymystä)',
            onSelect: () => {},
          },
        ],
      })
    );

    assert.ok(html.includes('Murtoluvut'));
    assert.ok(html.includes('Kaikki aiheet'));
    assert.ok(html.includes('24 kysymystä'));
    assert.ok(html.includes('12 kysymystä'));
    assert.ok(html.includes('Takaisin'));
  });
});
