import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { buildMindMapTree } from '@/lib/mindMap/buildMindMapTree';
import { layoutTree } from '@/lib/mindMap/layoutTree';
import { applyTopicMasteryToTree, mapMasteryPercentageToLevel } from '@/lib/mindMap/masteryAggregator';
import { colors } from '@/lib/design-tokens/colors';
import { AchievementsMapSection } from '@/components/mindMap/AchievementsMapSection';
import { MindMapLegend } from '@/components/mindMap/MindMapLegend';
import { MindMapNode } from '@/components/mindMap/MindMapNode';
import { MindMapSession } from '@/components/mindMap/MindMapSession';
import { MindMapHeader } from '@/components/mindMap/MindMapHeader';
import type { MindMapNode as MindMapTreeNode, PracticedSetDropdownItem } from '@/types/mindMap';

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

describe('Mind map components', () => {
  it('renders desktop node primitive labels and counts from layout output', () => {
    const tree = buildMindMapTree({
      rootId: 'root:set-10',
      rootLabel: 'Ympäristöoppi',
      questions: [
        { id: 'q1', topic: 'Luonto', subtopic: 'Metsä' },
        { id: 'q2', topic: 'Luonto', subtopic: 'Järvi' },
        { id: 'q3', topic: 'Sää', subtopic: 'Pilvet' },
      ],
    });

    const layout = layoutTree(tree);
    const rootNode = layout.nodes.find((node) => node.id === 'root:set-10');
    assert.ok(rootNode);

    const html = renderToString(
      createElement(
        'svg',
        null,
        createElement(MindMapNode, {
          node: rootNode!,
          onFocus: () => {},
        })
      )
    );

    assert.ok(html.includes('Ympäristöoppi'));
    assert.ok(html.includes('kys.'));
    assert.ok(html.includes('3'));
    assert.ok(html.includes('mind-map-node-root:set-10'));
    assert.ok(html.includes('role="button"'));
    assert.ok(html.includes('tabindex="0"'));
    assert.ok(html.includes('aria-label="Ympäristöoppi: 3 kysymystä, hallinta ei harjoiteltu"'));
    assert.equal(layout.nodes.length, 3);
  });

  it('renders legend with non-color-only mastery labels', () => {
    const html = renderToString(createElement(MindMapLegend));

    assert.ok(html.includes('Osaaminen'));
    assert.ok(html.includes('Ei harjoiteltu'));
    assert.ok(html.includes('Osittain hallittu'));
    assert.ok(html.includes('Hallittu'));
    assert.ok(html.includes('0-49 % oikein'));
    assert.ok(html.includes('&gt;= 80 % oikein'));
    assert.ok(html.includes('aria-label="Osaamisen selite"'));
    assert.ok(html.includes('flex-nowrap'));
    assert.ok(html.includes('overflow-x-auto'));
    assert.ok(!html.includes('sm:grid-cols-3'));
    assert.ok(!html.includes('bg-white px-2.5 py-2'));
  });

  it('renders session with desktop/mobile split and fallback notice', () => {
    const sessionHtml = renderToString(
      createElement(MindMapSession, {
        questionSetCode: 'ABC123',
        rootId: 'root:set-11',
        rootLabel: 'Historia',
        subtitle: '6. luokka',
        questions: [
          { id: 'q1', topic: 'Aikakaudet', subtopic: 'Antiikki' },
          { id: 'q2', topic: 'Aikakaudet', subtopic: 'Keskiaika' },
        ],
        onBack: () => {},
      })
    );

    assert.ok(sessionHtml.includes('data-testid="mind-map-session"'));
    assert.ok(sessionHtml.includes('class="hidden md:block"'));
    assert.ok(sessionHtml.includes('class="space-y-2 md:hidden"'));
    assert.ok(sessionHtml.includes('Aikakaudet'));
    assert.ok(sessionHtml.includes('aria-label="Aihekartta ABC123"'));
    assert.ok(sessionHtml.includes('role="tree"'));
    assert.ok(sessionHtml.includes('role="treeitem"'));
    assert.ok(sessionHtml.includes('aria-controls="accessible-topic-group-'));

    const fallbackHtml = renderToString(
      createElement(MindMapSession, {
        questionSetCode: 'DEF456',
        rootId: 'root:set-12',
        rootLabel: 'Musiikki',
        questions: [{ id: 'q1', topic: undefined, subtopic: undefined }],
        onBack: () => {},
      })
    );

    assert.ok(fallbackHtml.includes('Tähän kokoelmaan ei ole tallennettu aihealueita'));
  });

  it('renders fallback for fully empty question input', () => {
    const html = renderToString(
      createElement(MindMapSession, {
        questionSetCode: 'EMPTY0',
        rootId: 'root:set-13',
        rootLabel: 'Yhteiskuntaoppi',
        questions: [],
        onBack: () => {},
      })
    );

    assert.ok(html.includes('Tähän kokoelmaan ei ole tallennettu aihealueita'));
    assert.ok(html.includes('Päivitä'));
    assert.ok(html.includes('Zoom <!-- -->100'));
  });

  it('applies topic-level mastery in v1', () => {
    const tree = buildMindMapTree({
      rootId: 'root:set-13',
      rootLabel: 'Englanti',
      questions: [{ id: 'q1', topic: 'Sanasto', subtopic: 'Ruoka' }],
    });

    const withMastery = applyTopicMasteryToTree(tree);
    assert.equal(withMastery.children[0]?.mastery, 'none');
    assert.deepEqual(withMastery.children[0]?.children, []);
  });

  it('renders topic-only view and maps mastery thresholds for inline achievements map', () => {
    (globalThis as { localStorage?: Storage }).localStorage = new LocalStorageMock() as unknown as Storage;
    globalThis.localStorage?.setItem(
      'topic_mastery_MASTERY1',
      JSON.stringify({
        Algebra: { correct: 3, total: 6 }, // 50% -> partial
        Geometria: { correct: 4, total: 5 }, // 80% -> mastered
      })
    );

    const baseTree: MindMapTreeNode = {
      id: 'root:MASTERY1',
      kind: 'root',
      label: 'Matematiikka',
      questionCount: 6,
      questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
      mastery: 'none',
      children: [
        {
          id: 'topic:Algebra',
          kind: 'branch',
          label: 'Algebra',
          questionCount: 3,
          questionIds: ['q1', 'q2', 'q3'],
          mastery: 'none',
          children: [
            {
              id: 'subtopic:Yhtälöt',
              kind: 'branch',
              label: 'Yhtälöt',
              questionCount: 3,
              questionIds: ['q1', 'q2', 'q3'],
              mastery: 'none',
              children: [],
            },
          ],
        },
        {
          id: 'topic:Geometria',
          kind: 'branch',
          label: 'Geometria',
          questionCount: 3,
          questionIds: ['q4', 'q5', 'q6'],
          mastery: 'none',
          children: [],
        },
      ],
    };

    const withMastery = applyTopicMasteryToTree(baseTree, 'MASTERY1');
    assert.equal(withMastery.children[0]?.mastery, 'partial');
    assert.equal(withMastery.children[1]?.mastery, 'mastered');
    assert.deepEqual(withMastery.children[0]?.children, []);

    assert.equal(mapMasteryPercentageToLevel(50), 'partial');
    assert.equal(mapMasteryPercentageToLevel(80), 'mastered');
  });

  it('keeps dedicated map token palette for light and dark modes', () => {
    assert.equal(
      colors.map.primary,
      'bg-gradient-to-r from-violet-600 to-violet-500 dark:from-violet-500 dark:to-violet-400'
    );
    assert.equal(
      colors.map.light,
      'bg-violet-50 dark:bg-violet-900/20'
    );
    assert.equal(
      colors.map.ring,
      'ring-violet-500 dark:ring-violet-400'
    );

    const legendHtml = renderToString(createElement(MindMapLegend));
    assert.ok(legendHtml.includes('bg-violet-50'));
    assert.ok(legendHtml.includes('dark:bg-violet-900/20'));
  });

  it('renders zoom reset label from current scale', () => {
    const headerHtml = renderToString(
      createElement(MindMapHeader, {
        title: 'Historia',
        subtitle: '6. luokka',
        scale: 1.37,
        onBack: () => {},
        onRefresh: () => {},
        onResetZoom: () => {},
      })
    );

    assert.ok(headerHtml.includes('aria-label="Palauta zoomaus"'));
    assert.ok(headerHtml.includes('Zoom <!-- -->137'));
  });

  it('renders achievements map empty state without practiced sets', () => {
    const html = renderToString(createElement(AchievementsMapSection, { initialItems: [] }));

    assert.ok(html.includes('data-testid="achievements-map-section"'));
    assert.ok(html.includes('Osaaminen'));
    assert.ok(html.includes('data-testid="achievements-map-empty"'));
    assert.ok(html.includes('Harjoittele ensin ainakin yksi koe'));
  });

  it('renders achievements map fallback when selected set has no topic data', () => {
    const items: PracticedSetDropdownItem[] = [
      {
        code: 'ABC123',
        label: 'Matematiikka',
        subject: 'Matematiikka',
        examDate: '12.2.2026',
        grade: '5',
        practicedAt: null,
      },
    ];
    const rootOnlyTree: MindMapTreeNode = {
      id: 'root:ABC123',
      kind: 'root',
      label: 'Matematiikka',
      questionCount: 2,
      questionIds: ['q1', 'q2'],
      children: [],
      mastery: 'none',
    };

    const html = renderToString(
      createElement(AchievementsMapSection, {
        initialItems: items,
      })
    );

    assert.ok(html.includes('Valitse koe'));
    assert.ok(html.includes('Matematiikka • 12.2.2026 • 5. lk'));
    assert.ok(html.includes('data-testid="achievements-map-fallback"'));
    assert.ok(html.includes('Tähän kokeeseen ei ole tallennettu aihealueita'));
  });

  it('renders selector option labels with metadata-aware formatting and code fallback', () => {
    const items: PracticedSetDropdownItem[] = [
      {
        code: 'FULL11',
        label: 'Nimi',
        subject: 'Matematiikka',
        examDate: '12.2.2026',
        grade: '5',
        practicedAt: null,
      },
      {
        code: 'NODATE',
        label: 'Nimi',
        subject: 'Historia',
        examDate: null,
        grade: '6',
        practicedAt: null,
      },
      {
        code: 'NOGRADE',
        label: 'Nimi',
        subject: 'Biologia',
        examDate: '7.3.2026',
        grade: null,
        practicedAt: null,
      },
      {
        code: 'CODE77',
        label: '',
        subject: null,
        examDate: null,
        grade: null,
        practicedAt: null,
      },
    ];

    const html = renderToString(createElement(AchievementsMapSection, { initialItems: items }));

    assert.ok(html.includes('Valitse koe'));
    assert.ok(html.includes('Matematiikka • 12.2.2026 • 5. lk'));
    assert.ok(html.includes('Historia • 6. lk'));
    assert.ok(html.includes('Biologia • 7.3.2026'));
    assert.ok(html.includes('CODE77'));
    assert.ok(!html.includes(' •  • '));
  });

  it('renders achievements map desktop canvas and mobile flat list for populated set', () => {
    const items: PracticedSetDropdownItem[] = [
      {
        code: 'XYZ999',
        label: 'Historia',
        subject: 'Historia',
        examDate: '1.3.2026',
        grade: '6',
        practicedAt: null,
      },
    ];
    const populatedTree: MindMapTreeNode = {
      id: 'root:XYZ999',
      kind: 'root',
      label: 'Historia',
      questionCount: 6,
      questionIds: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
      mastery: 'none',
      children: [
        {
          id: 'topic:Aikakaudet',
          kind: 'branch',
          label: 'Aikakaudet',
          questionCount: 3,
          questionIds: ['q1', 'q2', 'q3'],
          children: [],
          mastery: 'partial',
        },
        {
          id: 'topic:Sodat',
          kind: 'branch',
          label: 'Sodat',
          questionCount: 3,
          questionIds: ['q4', 'q5', 'q6'],
          children: [],
          mastery: 'mastered',
        },
      ],
    };

    const html = renderToString(
      createElement(AchievementsMapSection, {
        initialItems: items,
      })
    );

    assert.ok(html.includes('data-testid="achievements-map-desktop"'));
    assert.ok(html.includes('data-testid="achievements-map-mobile-list"'));
    assert.ok(html.includes('aria-labelledby="achievements-map-heading"'));
    assert.ok(!html.includes('Valitse kokoelma'));
    assert.ok(!html.includes('Osaaminen avautuu automaattisesti'));
    assert.ok(!html.includes('aria-describedby="achievements-map-a11y-hint"'));
    assert.ok(html.includes('Aikakaudet'));
    assert.ok(html.includes('Sodat'));
    assert.ok(html.includes('Osittain hallittu'));
    assert.ok(html.includes('Hallittu'));
    assert.ok(html.includes('aria-label="Osaamisen aiheluettelo: Historia"'));
    assert.ok(html.includes('aria-label="Osaamisen aiheluettelo ruudunlukijalle: Historia"'));
    assert.ok(html.includes('role="treeitem"'));
    assert.ok(html.includes('focus-visible:ring-offset-2'));
    assert.ok(html.includes('ring-violet-500'));
    assert.ok(html.includes('aria-label="Palauta zoomaus"'));
    assert.ok(html.includes('Zoom <!-- -->100'));
  });
});
