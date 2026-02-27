import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  clampMindMapScale,
  getNextPinchScale,
  getNextWheelScale,
  mindMapZoomBounds,
} from '@/components/mindMap/MindMapCanvas';

const canvasSource = readFileSync('src/components/mindMap/MindMapCanvas.tsx', 'utf-8');
const sectionSource = readFileSync('src/components/mindMap/AchievementsMapSection.tsx', 'utf-8');

describe('Mind map zoom interactions', () => {
  it('exports zoom bounds contract at 0.5x..2x', () => {
    assert.equal(mindMapZoomBounds.min, 0.5);
    assert.equal(mindMapZoomBounds.max, 2);
  });

  it('clamps wheel and pinch updates to configured bounds', () => {
    assert.equal(clampMindMapScale(0.2), 0.5);
    assert.equal(clampMindMapScale(2.7), 2);
    assert.equal(clampMindMapScale(1.234), 1.23);

    assert.equal(getNextWheelScale(1.95, -10), 2);
    assert.equal(getNextWheelScale(0.55, 10), 0.5);

    assert.equal(getNextPinchScale(1.95, 120), 2);
    assert.equal(getNextPinchScale(0.55, -120), 0.5);
  });

  it('uses bounded scale updates and reset control in achievements section', () => {
    assert.ok(canvasSource.includes('onScaleChange(getNextWheelScale(scale, event.deltaY));'));
    assert.ok(canvasSource.includes('onScaleChange(getNextPinchScale(scale, delta));'));
    assert.ok(sectionSource.includes("const [scaleMode, setScaleMode] = useState<'fit' | 'manual'>('fit');"));
    assert.ok(sectionSource.includes('if (scaleMode !== \'fit\') return;'));
    assert.ok(sectionSource.includes('setScale(clampMindMapScale(nextScale));'));
    assert.ok(canvasSource.includes('calculateMindMapFitScale'));
    assert.ok(sectionSource.includes("setScaleMode('fit');"));
    assert.ok(sectionSource.includes('setScale(fitScale);'));
    assert.ok(sectionSource.includes('onClick={() => handleScaleChange(scale - 0.1)}'));
    assert.ok(sectionSource.includes('onClick={() => handleScaleChange(scale + 0.1)}'));
  });

  it('keeps keyboard and screen-reader accessibility hooks in map controls', () => {
    assert.ok(sectionSource.includes('id="achievements-map-set"'));
    assert.ok(sectionSource.includes('focus-visible:ring-offset-2'));
    assert.ok(sectionSource.includes('size="iconLg"'));
    assert.ok(sectionSource.includes('role="tree"'));
    assert.ok(sectionSource.includes('role="treeitem"'));
    assert.ok(sectionSource.includes('Osaamisen aiheluettelo ruudunlukijalle'));
    assert.ok(sectionSource.includes('aria-label="Palauta zoomaus"'));
  });
});
