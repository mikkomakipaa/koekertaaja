import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildMindMapTree } from '@/lib/mindMap/buildMindMapTree';
import { layoutTree } from '@/lib/mindMap/layoutTree';

describe('layoutTree', () => {
  it('creates stable coordinates for a fixed fixture', () => {
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

    const layout = layoutTree(tree, { width: 800, height: 800, levelGap: 150 });
    const byId = Object.fromEntries(layout.nodes.map((node) => [node.id, node]));

    assert.equal(layout.nodes.length, 3);
    assert.equal(layout.edges.length, 2);
    assert.deepEqual([layout.centerX, layout.centerY], [400, 400]);
    assert.deepEqual([byId['root:set-1']?.x, byId['root:set-1']?.y], [400, 400]);
    assert.deepEqual([byId['topic:Geometria']?.x, byId['topic:Geometria']?.y], [550, 400]);
    assert.deepEqual([byId['topic:Luvut']?.x, byId['topic:Luvut']?.y], [250, 400]);
  });

  it('is deterministic regardless of input question order', () => {
    const one = buildMindMapTree({
      rootId: 'root:set-2',
      rootLabel: 'Historia',
      questions: [
        { id: 'q1', topic: 'Aikakaudet', subtopic: 'Keskiaika' },
        { id: 'q2', topic: 'Aikakaudet', subtopic: 'Antiikki' },
        { id: 'q3', topic: 'Sodat', subtopic: 'Talvisota' },
      ],
    });
    const two = buildMindMapTree({
      rootId: 'root:set-2',
      rootLabel: 'Historia',
      questions: [
        { id: 'q3', topic: 'Sodat', subtopic: 'Talvisota' },
        { id: 'q2', topic: 'Aikakaudet', subtopic: 'Antiikki' },
        { id: 'q1', topic: 'Aikakaudet', subtopic: 'Keskiaika' },
      ],
    });

    const layoutA = layoutTree(one, { width: 900, height: 900, levelGap: 170 });
    const layoutB = layoutTree(two, { width: 900, height: 900, levelGap: 170 });

    assert.deepEqual(layoutA.nodes, layoutB.nodes);
    assert.deepEqual(layoutA.edges, layoutB.edges);
  });
});
