import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { SubjectSelector } from '@/components/create/SubjectSelector';
import { GradeSelector } from '@/components/create/GradeSelector';
import { DifficultySelector } from '@/components/create/DifficultySelector';

describe('create selectors shared selection card styles', () => {
  it('SubjectSelector applies selected and unselected card styles', () => {
    const html = renderToString(
      createElement(SubjectSelector, {
        selectedSubject: 'english',
        onSubjectChange: () => {},
      })
    );

    assert.ok(html.includes('border-indigo-600 bg-indigo-50 text-indigo-700'));
    assert.ok(html.includes('border-gray-300 bg-white text-gray-700 hover:border-indigo-400'));
  });

  it('GradeSelector keeps optional empty state and selected card styling', () => {
    const html = renderToString(
      createElement(GradeSelector, {
        selectedGrade: undefined,
        onGradeChange: () => {},
      })
    );

    assert.ok(html.includes('Ei valittu'));
    assert.ok(html.includes('border-indigo-600 bg-indigo-50 text-indigo-700'));
    assert.ok(html.includes('border-gray-300 bg-white text-gray-700 hover:border-indigo-400'));
  });

  it('DifficultySelector renders label/description with selected card styling', () => {
    const html = renderToString(
      createElement(DifficultySelector, {
        selectedDifficulty: 'helppo',
        onDifficultyChange: () => {},
      })
    );

    assert.ok(html.includes('Helppo'));
    assert.ok(html.includes('Perusasiat ja yksinkertaiset kysymykset'));
    assert.ok(html.includes('border-indigo-600 bg-indigo-50 text-indigo-700'));
    assert.ok(html.includes('border-gray-300 bg-white text-gray-700 hover:border-indigo-400'));
  });
});
