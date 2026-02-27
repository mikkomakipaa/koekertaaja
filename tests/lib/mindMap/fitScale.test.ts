import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateMindMapFitScale } from '@/lib/mindMap/fitScale';

describe('calculateMindMapFitScale', () => {
  it('calculates fit scale from container and layout bounds', () => {
    const scale = calculateMindMapFitScale({
      containerWidth: 1200,
      containerHeight: 580,
      layoutWidth: 960,
      layoutHeight: 960,
      padding: 24,
      minScale: 0.5,
      maxScale: 2,
    });

    assert.equal(scale, 0.55);
  });

  it('does not upscale above 1.0 even when container is large', () => {
    const scale = calculateMindMapFitScale({
      containerWidth: 2400,
      containerHeight: 1800,
      layoutWidth: 960,
      layoutHeight: 960,
      padding: 24,
      minScale: 0.5,
      maxScale: 2,
    });

    assert.equal(scale, 1);
  });

  it('clamps to min and max bounds', () => {
    const minScale = calculateMindMapFitScale({
      containerWidth: 220,
      containerHeight: 220,
      layoutWidth: 960,
      layoutHeight: 960,
      padding: 24,
      minScale: 0.5,
      maxScale: 2,
    });

    const maxScale = calculateMindMapFitScale({
      containerWidth: 2400,
      containerHeight: 1800,
      layoutWidth: 960,
      layoutHeight: 960,
      padding: 24,
      minScale: 0.5,
      maxScale: 0.8,
      maxAutoScale: 2,
    });

    assert.equal(minScale, 0.5);
    assert.equal(maxScale, 0.8);
  });
});
