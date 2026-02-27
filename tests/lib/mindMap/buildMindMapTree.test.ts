import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMindMapTree } from '@/lib/mindMap/buildMindMapTree';

describe('buildMindMapTree', () => {
  it('builds deterministic topic structure for mixed data', () => {
    const tree = buildMindMapTree({
      rootId: 'root:set-1',
      rootLabel: 'Matematiikka',
      questions: [
        { id: 'q5', topic: 'Geometria', subtopic: 'Kulmat' },
        { id: 'q2', topic: 'Luvut', subtopic: 'Parilliset' },
        { id: 'q1', topic: 'Luvut', subtopic: 'Parilliset' },
        { id: 'q4', topic: 'Luvut', subtopic: 'Murtoluvut' },
        { id: 'q3', topic: 'Luvut' },
      ],
    });

    assert.equal(tree.kind, 'root');
    assert.equal(tree.questionCount, 5);
    assert.deepEqual(tree.questionIds, ['q1', 'q2', 'q3', 'q4', 'q5']);
    assert.deepEqual(tree.children.map((node) => node.label), ['Geometria', 'Luvut']);

    const geometry = tree.children[0];
    assert.equal(geometry.questionCount, 1);
    assert.deepEqual(geometry.questionIds, ['q5']);
    assert.deepEqual(geometry.children, []);

    const numbers = tree.children[1];
    assert.equal(numbers.questionCount, 4);
    assert.deepEqual(numbers.questionIds, ['q1', 'q2', 'q3', 'q4']);
    assert.deepEqual(numbers.children, []);
  });

  it('handles sparse topic metadata by excluding blank topic/subtopic values', () => {
    const tree = buildMindMapTree({
      rootId: 'root:set-2',
      rootLabel: 'Ympäristöoppi',
      questions: [
        { id: 'q1', topic: '  Luonto  ', subtopic: ' Metsä ' },
        { id: 'q2', topic: 'Luonto', subtopic: ' ' },
        { id: 'q3', topic: '', subtopic: 'Kasvit' },
        { id: 'q4', topic: undefined, subtopic: undefined },
      ],
    });

    assert.equal(tree.questionCount, 4);
    assert.deepEqual(tree.children.map((node) => node.label), ['Luonto']);
    assert.equal(tree.children[0].questionCount, 2);
    assert.deepEqual(tree.children[0].children, []);
  });

  it('returns root-only tree for datasets without topic metadata', () => {
    const tree = buildMindMapTree({
      rootId: 'root:set-3',
      rootLabel: 'Historia',
      questions: [
        { id: 'q1', topic: undefined, subtopic: undefined },
        { id: 'q2', topic: null, subtopic: 'Itsenäisyys' },
        { id: 'q3', topic: '   ', subtopic: 'Sodat' },
      ],
    });

    assert.equal(tree.kind, 'root');
    assert.equal(tree.questionCount, 3);
    assert.deepEqual(tree.children, []);
  });
});
