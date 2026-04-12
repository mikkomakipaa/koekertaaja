import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildModeGradeQuery, parseGradeParam } from '@/lib/play/mode-grade-query';

describe('mode-grade-query', () => {
  it('parses grade safely', () => {
    assert.strictEqual(parseGradeParam('4'), 4);
    assert.strictEqual(parseGradeParam('6'), 6);
    assert.strictEqual(parseGradeParam('0'), null);
    assert.strictEqual(parseGradeParam('-2'), null);
    assert.strictEqual(parseGradeParam('abc'), null);
    assert.strictEqual(parseGradeParam(null), null);
  });

  it('builds query while preserving unrelated params and removing mode', () => {
    const query = buildModeGradeQuery('foo=bar&mode=pelaa', 5);
    const params = new URLSearchParams(query);

    assert.strictEqual(params.get('foo'), 'bar');
    assert.strictEqual(params.get('mode'), null);
    assert.strictEqual(params.get('grade'), '5');
  });

  it('removes grade and mode when all classes selected', () => {
    const query = buildModeGradeQuery('mode=opettele&grade=6', null);
    const params = new URLSearchParams(query);

    assert.strictEqual(params.get('mode'), null);
    assert.strictEqual(params.get('grade'), null);
  });
});
