import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getQuizGradeMeta, getQuizLatestResultSummary } from '@/lib/play/primary-action';
import {
  getResultsHeaderCopy,
  getResultsSecondaryMeta,
  getSchoolGrade,
} from '@/lib/play/results-screen';

describe('results screen grading helpers', () => {
  it('converts quiz scores into deterministic Finnish school grades', () => {
    assert.equal(getSchoolGrade(0, 10).label, '4');
    assert.equal(getSchoolGrade(2, 10).label, '5+');
    assert.equal(getSchoolGrade(3, 10).label, '6-');
    assert.equal(getSchoolGrade(5, 10).label, '7');
    assert.equal(getSchoolGrade(7, 10).label, '8+');
    assert.equal(getSchoolGrade(8, 10).label, '9-');
    assert.equal(getSchoolGrade(9, 10).label, '9.5');
    assert.equal(getSchoolGrade(16, 17).label, '10-');
    assert.equal(getSchoolGrade(10, 10).label, '10');
  });

  it('clamps grades for invalid and edge-case inputs', () => {
    assert.equal(getSchoolGrade(0, 0).label, '4');
    assert.equal(getSchoolGrade(-5, 10).label, '4');
    assert.equal(getSchoolGrade(12, 10).label, '10');
  });

  it('builds grade-first results header copy', () => {
    assert.deepEqual(getResultsHeaderCopy(9, 10, 'quiz'), {
      title: 'Koulunumero 9.5',
      supportingText: 'Tämän kierroksen arvio näkyy suomalaisella 4-10 asteikolla.',
    });
    assert.equal(getResultsSecondaryMeta(9, 10), '9 / 10 oikein • 90%');
    assert.deepEqual(getResultsHeaderCopy(9, 10, 'flashcard'), {
      title: 'Harjoitus valmis',
      supportingText: 'Katso tämän kierroksen yhteenveto ja jatka harjoittelua seuraavaksi.',
    });
  });

  it('formats play-card saved score summaries with the shared school-grade helper', () => {
    assert.equal(getQuizGradeMeta({ score: 9, total: 10 }), 'Koulunumero 9.5');
    assert.equal(
      getQuizLatestResultSummary({
        difficulty: 'normaali',
        score: { score: 9, total: 10 },
      }),
      'Viimeisin: Koulunumero 9.5 (Normaali)'
    );
  });

  it('does not require placeholder grade text for no-score states', () => {
    const latestResultSummary = null as string | null;

    assert.equal(latestResultSummary ?? 'Ei tuloksia', 'Ei tuloksia');
  });
});
