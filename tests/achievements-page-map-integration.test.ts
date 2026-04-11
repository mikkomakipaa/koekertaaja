import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AchievementsPageContent } from '@/app/play/achievements/AchievementsPageContent';
import type { Badge } from '@/types';
import type { MindMapNode, PracticedSetDropdownItem } from '@/types/mindMap';

const badgesFixture: Badge[] = [
  {
    id: 'first_session',
    name: 'Skibidi Alku',
    description: 'Suorita ensimmäinen harjoituskierros',
    emoji: '✨',
    unlockConditions: ['Suorita ensimmäinen harjoitussessiosi'],
    unlocked: true,
    unlockedAt: new Date('2026-01-01T12:00:00.000Z'),
  },
  {
    id: '5_sessions',
    name: 'NPC ei olla',
    description: 'Suorita 5 harjoituskierrosta',
    emoji: '🎮',
    unlockConditions: ['Suorita 5 harjoitussessiota'],
    unlocked: false,
  },
];

const statsFixture = {
  totalSessions: 7,
  perfectScores: 2,
  personalBest: 140,
  levelsPlayed: ['helppo', 'normaali'],
};

describe('Achievements page map integration', () => {
  it('renders map section below badges and shows no-practiced-set empty state', () => {
    const html = renderToString(
      createElement(AchievementsPageContent, {
        badges: badgesFixture,
        stats: statsFixture,
        mapSectionProps: { initialItems: [] },
      })
    );

    const badgesIndex = html.indexOf('Kaikki merkit');
    const mapIndex = html.indexOf('data-testid="achievements-map-section"');

    assert.ok(badgesIndex !== -1);
    assert.ok(mapIndex > badgesIndex);
    assert.ok(html.includes('Sessiota'));
    assert.ok(html.includes('Täydellistä'));
    assert.ok(html.includes('Ennätys'));
    assert.ok(html.includes('Merkkejä'));
    assert.ok(html.includes('grid-cols-3'));
    assert.ok(html.includes('Aiheet'));
    assert.ok(html.includes('Merkit ('));
    assert.ok(html.includes('Kokeet'));
    assert.ok(html.includes('Pelaa yksi harjoituskierros, niin koetulokset ilmestyvät tänne.'));
    assert.ok(html.includes('Skibidi Alku'));
    assert.ok(html.includes('NPC ei olla'));
    assert.ok(html.includes('Osaaminen'));
    assert.ok(html.includes('data-testid="achievements-map-empty"'));
    assert.ok(html.includes('Harjoittele ensin ainakin yksi koe'));
  });

  it('renders collection selector and populated map when practiced set exists', () => {
    const practicedItems: PracticedSetDropdownItem[] = [
      {
        code: 'XYZ999',
        label: 'Historia',
        subject: 'Historia',
        examDate: '1.3.2026',
        grade: '6',
        practicedAt: null,
      },
    ];
    const populatedTree: MindMapNode = {
      id: 'root:XYZ999',
      kind: 'root',
      label: 'Historia',
      questionCount: 4,
      questionIds: ['q1', 'q2', 'q3', 'q4'],
      mastery: 'none',
      children: [
        {
          id: 'topic:Aikakaudet',
          kind: 'branch',
          label: 'Aikakaudet',
          questionCount: 4,
          questionIds: ['q1', 'q2', 'q3', 'q4'],
          mastery: 'partial',
          children: [],
        },
      ],
    };

    const html = renderToString(
      createElement(AchievementsPageContent, {
        badges: badgesFixture,
        stats: statsFixture,
        mapSectionProps: {
          initialItems: practicedItems,
        },
      })
    );

    assert.ok(html.includes('Osaaminen'));
    assert.ok(html.includes('Valitse koe'));
    assert.ok(!html.includes('Valitse kokoelma'));
    assert.ok(html.includes('Historia • 1.3.2026 • 6. lk'));
    assert.ok(html.includes('Aikakaudet'));
    assert.ok(!html.includes('data-testid="achievements-map-empty"'));
  });

  it('renders map fallback when practiced set exists but topic data is missing', () => {
    const practicedItems: PracticedSetDropdownItem[] = [
      {
        code: 'NODATA1',
        label: 'Ympäristöoppi',
        subject: 'Ympäristöoppi',
        examDate: null,
        grade: '5',
        practicedAt: null,
      },
    ];
    const rootOnlyTree: MindMapNode = {
      id: 'root:NODATA1',
      kind: 'root',
      label: 'Ympäristöoppi',
      questionCount: 2,
      questionIds: ['q1', 'q2'],
      mastery: 'none',
      children: [],
    };

    const html = renderToString(
      createElement(AchievementsPageContent, {
        badges: badgesFixture,
        stats: statsFixture,
        mapSectionProps: {
          initialItems: practicedItems,
        },
      })
    );

    assert.ok(html.includes('Osaaminen'));
    assert.ok(html.includes('Valitse koe'));
    assert.ok(html.includes('data-testid="achievements-map-fallback"'));
    assert.ok(html.includes('Tähän kokeeseen ei ole tallennettu aihealueita'));
  });
});
