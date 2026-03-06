import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { stripDifficultySuffix } from '@/lib/question-set-name';

describe('question set name helpers', () => {
  it('strips known difficulty suffix variants', () => {
    assert.equal(stripDifficultySuffix('Murtoluvut - Helppo'), 'Murtoluvut');
    assert.equal(stripDifficultySuffix('Murtoluvut - Normaali'), 'Murtoluvut');
    assert.equal(stripDifficultySuffix('Murtoluvut - Aikahaaste'), 'Murtoluvut');
    assert.equal(stripDifficultySuffix('Murtoluvut - Kortit'), 'Murtoluvut');
  });

  it('keeps name unchanged when no suffix is present', () => {
    assert.equal(stripDifficultySuffix('Murtoluvut'), 'Murtoluvut');
    assert.equal(stripDifficultySuffix('Murtoluvut - Vaikea'), 'Murtoluvut - Vaikea');
  });
});
