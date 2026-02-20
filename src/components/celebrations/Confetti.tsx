'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ConfettiProps {
  count?: number;
  duration?: number;
  colors?: string[];
  onComplete?: () => void;
}

export interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  duration: number;
  rotation: number;
  color: string;
  size: number;
}

export const DEFAULT_COLORS = [
  'bg-emerald-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
] as const;

const PIECE_SIZES = [8, 12, 16] as const;
const DEFAULT_COUNT = 60;
const MOBILE_COUNT = 40;
const DEFAULT_DURATION = 3000;
const CLEANUP_DURATION = 3500;

/**
 * Resolves whether the current viewport should be treated as mobile.
 */
export function isMobileViewport(viewportWidth: number): boolean {
  return viewportWidth < 768;
}

/**
 * Resolves the final particle count, limiting confetti on mobile devices.
 */
export function getConfettiParticleCount(count?: number, viewportWidth?: number): number {
  if (typeof viewportWidth === 'number' && isMobileViewport(viewportWidth)) {
    return MOBILE_COUNT;
  }

  return count ?? DEFAULT_COUNT;
}

/**
 * Creates randomized confetti particles for a single celebration run.
 */
export function generateConfetti(count: number, colors: readonly string[]): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 300,
    duration: 2000 + Math.random() * 1000,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)] ?? DEFAULT_COLORS[0],
    size: PIECE_SIZES[Math.floor(Math.random() * PIECE_SIZES.length)] ?? PIECE_SIZES[0],
  }));
}

/**
 * Schedules cleanup callback after the confetti animation window.
 */
export function scheduleConfettiCleanup(onComplete?: () => void, timeoutMs: number = CLEANUP_DURATION) {
  if (!onComplete) {
    return null;
  }

  return setTimeout(() => {
    onComplete();
  }, timeoutMs);
}

/**
 * Renders a lightweight confetti rain effect for celebration overlays.
 */
export function Confetti({ count, duration = DEFAULT_DURATION, colors = [...DEFAULT_COLORS], onComplete }: ConfettiProps) {
  const [isFinished, setIsFinished] = useState(false);
  const particleCount = useMemo(() => {
    if (typeof window === 'undefined') {
      return count ?? DEFAULT_COUNT;
    }

    return getConfettiParticleCount(count, window.innerWidth);
  }, [count]);

  const confettiPieces = useMemo(() => generateConfetti(particleCount, colors), [particleCount, colors]);

  useEffect(() => {
    const timer = scheduleConfettiCleanup(onComplete, Math.max(CLEANUP_DURATION, duration + 500));
    const finishTimer = setTimeout(() => {
      setIsFinished(true);
    }, Math.max(CLEANUP_DURATION, duration + 500));

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      clearTimeout(finishTimer);
    };
  }, [duration, onComplete]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className={cn('confetti absolute rounded-sm', isFinished && 'finished', piece.color)}
          style={{
            left: `${piece.x}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animation: `confetti-fall ${piece.duration}ms linear ${piece.delay}ms forwards`,
            transform: `translateZ(0) rotate(${piece.rotation}deg)`,
            ['--drift' as string]: `${(Math.random() - 0.5) * 60}px`,
          }}
        />
      ))}
    </div>
  );
}
