'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SparklesProps {
  count?: number;
}

export interface SparklePiece {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
}

export const DEFAULT_SPARKLE_COLORS = [
  'bg-white',
  'bg-amber-200',
  'bg-yellow-300',
] as const;

const DEFAULT_COUNT = 30;

/**
 * Creates sparkle particles positioned in a circular pattern around the modal center.
 */
export function generateSparkles(count: number, colors: readonly string[] = DEFAULT_SPARKLE_COLORS): SparklePiece[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / Math.max(count, 1)) * Math.PI * 2;
    const radius = 20 + Math.random() * 18;
    const x = 50 + Math.cos(angle) * radius;
    const y = 38 + Math.sin(angle) * radius;

    return {
      id: index,
      x,
      y,
      delay: Math.random() * 500,
      duration: 900 + Math.random() * 600,
      size: 4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? DEFAULT_SPARKLE_COLORS[0],
    };
  });
}

/**
 * Renders ambient sparkles for the all-badges celebration state.
 */
export function Sparkles({ count = DEFAULT_COUNT }: SparklesProps) {
  const sparkles = useMemo(() => generateSparkles(count), [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {sparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className={cn('sparkle absolute rounded-full opacity-0', sparkle.color)}
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: `${sparkle.size}px`,
            height: `${sparkle.size}px`,
            animation: `sparkle-pulse ${sparkle.duration}ms ease-in-out ${sparkle.delay}ms infinite`,
            transform: 'translate3d(-50%, -50%, 0)',
          }}
        />
      ))}
    </div>
  );
}
