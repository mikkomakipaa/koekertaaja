import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import {
  buildGroupedExamSummaries,
  ExamHistoryTabContent,
  getDifficultyRowPresentation,
} from '@/components/achievements/ExamHistoryTab';
import type { ExamHistoryEntry } from '@/types/examHistory';

describe('ExamHistoryTab', () => {
  it('renders mastery snapshot rows with distinct visual states and secondary play actions', () => {
    const entries: ExamHistoryEntry[] = [
      {
        code: 'MAT101H',
        name: 'Murtoluvut',
        subject: 'Matematiikka',
        examDate: '2026-03-14',
        difficulty: 'helppo',
        grade: '5',
        sortTimestamp: 1710400000000,
        lastScore: {
          score: 10,
          total: 10,
          percentage: 100,
          timestamp: 1710400000000,
          difficulty: 'helppo',
        },
      },
      {
        code: 'MAT101N',
        name: 'Murtoluvut',
        subject: 'Matematiikka',
        examDate: '2026-03-14',
        difficulty: 'normaali',
        grade: '5',
        sortTimestamp: 1710390000000,
        lastScore: {
          score: 1,
          total: 10,
          percentage: 10,
          timestamp: 1710390000000,
          difficulty: 'normaali',
        },
      },
      {
        code: 'HIS201H',
        name: 'Suomen historia',
        subject: 'Historia',
        examDate: '2026-02-10',
        difficulty: 'helppo',
        grade: '6',
        sortTimestamp: 1710300000000,
        lastScore: {
          score: 7,
          total: 10,
          percentage: 70,
          timestamp: 1710300000000,
          difficulty: 'helppo',
        },
      },
      {
        code: 'HIS201N',
        name: 'Suomen historia',
        subject: 'Historia',
        examDate: '2026-02-10',
        difficulty: 'normaali',
        grade: '6',
        sortTimestamp: 1710290000000,
        lastScore: null,
      },
    ];

    const groupedEntries = buildGroupedExamSummaries(entries);
    const html = renderToString(
      createElement(ExamHistoryTabContent, {
        groupedEntries,
        isEmpty: false,
      })
    );

    assert.ok(html.includes('14.03.2026'));
    assert.ok(html.includes('10.02.2026'));
    assert.ok(html.includes('data-tone="perfect"'));
    assert.ok(html.includes('data-tone="fail"'));
    assert.ok(html.includes('data-tone="empty"'));
    assert.ok(html.includes('Ei tulosta'));
    assert.ok(html.includes('href="/play/HIS201N?mode=pelaa"'));
    assert.ok(html.includes('href="/play/MAT101H?mode=pelaa"'));
    assert.ok(html.includes('10/10 oikein'));
    assert.ok(!html.includes('Paras tulos:'));
    assert.ok(!html.includes('Arvosana 10'));
    assert.ok(!html.includes('Paras'));
  });

  it('returns row tones for empty, passing, and perfect states', () => {
    assert.equal(getDifficultyRowPresentation(null, null).tone, 'empty');
    assert.equal(getDifficultyRowPresentation('7', 7).tone, 'pass');
    assert.equal(getDifficultyRowPresentation('5+', 5.25).tone, 'fail');
    assert.equal(getDifficultyRowPresentation('10', 10).tone, 'perfect');
  });
});
