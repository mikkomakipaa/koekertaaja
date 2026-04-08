import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  getResultsHeaderCopy,
  getResultsSecondaryMeta,
} from '@/lib/play/results-screen';

const resultsScreenSource = readFileSync('src/components/play/ResultsScreen.tsx', 'utf-8');

describe('results screen header regressions', () => {
  it('uses minimal quiz header copy and keeps score details out of the header helper', () => {
    assert.deepEqual(getResultsHeaderCopy(9, 10, 'quiz'), {
      title: 'Tulokset',
      supportingText: 'Tietovisan yhteenveto',
    });
    assert.equal(getResultsSecondaryMeta(9, 10), '9 / 10 oikein • 90%');
  });

  it('keeps the simplified results header contract in the component source', () => {
    assert.ok(resultsScreenSource.includes('const resultsHeaderCopy = getResultsHeaderCopy(score, total, mode);'));
    assert.ok(resultsScreenSource.includes('{resultsHeaderCopy.title}'));
    assert.ok(resultsScreenSource.includes('{resultsHeaderCopy.supportingText}'));
    assert.ok(resultsScreenSource.includes('mb-4 border-b border-slate-200/80 pb-4'));
    assert.ok(resultsScreenSource.includes('<GradeCard'));
    assert.ok(!resultsScreenSource.includes('{resultsSecondaryMeta}'));
  });
});
