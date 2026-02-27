'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, type TouchEvent, type WheelEvent } from 'react';
import { layoutTree } from '@/lib/mindMap/layoutTree';
import { calculateMindMapFitScale } from '@/lib/mindMap/fitScale';
import { colors } from '@/lib/design-tokens';
import type { MindMapNode } from '@/types/mindMap';
import { MindMapNode as MindMapNodePrimitive } from './MindMapNode';

interface MindMapCanvasProps {
  tree: MindMapNode;
  scale: number;
  onScaleChange: (nextScale: number) => void;
  onFitScaleChange?: (nextScale: number) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const FIT_SCALE_PADDING = 24;

export const clampMindMapScale = (value: number): number => {
  if (value < MIN_SCALE) return MIN_SCALE;
  if (value > MAX_SCALE) return MAX_SCALE;
  return Math.round(value * 100) / 100;
};

export const getNextWheelScale = (scale: number, deltaY: number): number => {
  const zoomStep = deltaY < 0 ? 0.1 : -0.1;
  return clampMindMapScale(scale + zoomStep);
};

export const getNextPinchScale = (scale: number, delta: number): number => {
  return clampMindMapScale(scale + delta / 240);
};

const getTouchDistance = (event: TouchEvent<SVGSVGElement>): number | null => {
  if (event.touches.length < 2) return null;
  const [first, second] = [event.touches[0], event.touches[1]];
  if (!first || !second) return null;
  const deltaX = second.clientX - first.clientX;
  const deltaY = second.clientY - first.clientY;
  return Math.hypot(deltaX, deltaY);
};

export function MindMapCanvas({ tree, scale, onScaleChange, onFitScaleChange }: MindMapCanvasProps) {
  const lastPinchDistanceRef = useRef<number | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const lastFitScaleRef = useRef<number | null>(null);
  const layout = useMemo(() => layoutTree(tree), [tree]);

  const reportFitScale = useCallback((containerWidth: number, containerHeight: number) => {
    if (!onFitScaleChange) return;

    const nextScale = calculateMindMapFitScale({
      containerWidth,
      containerHeight,
      layoutWidth: layout.width,
      layoutHeight: layout.height,
      padding: FIT_SCALE_PADDING,
      minScale: MIN_SCALE,
      maxScale: MAX_SCALE,
    });

    if (lastFitScaleRef.current === nextScale) return;
    lastFitScaleRef.current = nextScale;
    onFitScaleChange(nextScale);
  }, [layout.height, layout.width, onFitScaleChange]);

  useLayoutEffect(() => {
    const element = canvasContainerRef.current;
    if (!element) return;
    reportFitScale(element.clientWidth, element.clientHeight);
  }, [reportFitScale]);

  useLayoutEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const element = canvasContainerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      reportFitScale(entry.contentRect.width, entry.contentRect.height);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [reportFitScale]);

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    onScaleChange(getNextWheelScale(scale, event.deltaY));
  };

  const handleTouchStart = (event: TouchEvent<SVGSVGElement>) => {
    lastPinchDistanceRef.current = getTouchDistance(event);
  };

  const handleTouchMove = (event: TouchEvent<SVGSVGElement>) => {
    const nextDistance = getTouchDistance(event);
    const lastDistance = lastPinchDistanceRef.current;

    if (nextDistance === null || lastDistance === null) {
      return;
    }

    event.preventDefault();
    const delta = nextDistance - lastDistance;
    onScaleChange(getNextPinchScale(scale, delta));
    lastPinchDistanceRef.current = nextDistance;
  };

  const handleTouchEnd = () => {
    lastPinchDistanceRef.current = null;
  };

  return (
    <div className={`rounded-2xl border border-violet-200 bg-white p-3 dark:border-violet-800/70 dark:bg-gray-900 ${colors.map.light}`}>
      <div
        ref={canvasContainerRef}
        className="overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-b from-white to-violet-50 dark:border-violet-900/60 dark:from-gray-900 dark:to-violet-950/30"
      >
        <svg
          data-testid="mind-map-svg"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-[580px] w-full touch-none transition-transform duration-150"
          style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Aihekartta"
          role="img"
        >
          <g className="stroke-violet-300 dark:stroke-violet-700">
            {layout.edges.map((edge) => (
              <line
                key={edge.id}
                data-testid={`mind-map-edge-${edge.id}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                strokeWidth={2}
              />
            ))}
          </g>

          {layout.nodes.map((node) => (
            <MindMapNodePrimitive
              key={node.id}
              node={node}
              isFocused={node.id === tree.id}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

export const mindMapZoomBounds = {
  min: MIN_SCALE,
  max: MAX_SCALE,
};
