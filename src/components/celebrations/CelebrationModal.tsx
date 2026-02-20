'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/celebrations/Confetti';
import { Sparkles } from '@/components/celebrations/Sparkles';
import type { Badge } from '@/types';

export interface CelebrationModalProps {
  type: 'perfect-score' | 'all-badges';
  onClose: () => void;
  questionSetName?: string;
  badges?: Badge[];
}

export interface KeyboardEventLike {
  key: string;
  shiftKey?: boolean;
  preventDefault: () => void;
}

export interface FocusableElementLike {
  focus: () => void;
}

/**
 * Calculates the next focus target index for tab wrapping inside modal.
 */
export function getNextFocusIndex(currentIndex: number, total: number, shiftKey: boolean): number {
  if (total <= 0) {
    return -1;
  }

  if (currentIndex < 0) {
    return shiftKey ? total - 1 : 0;
  }

  if (shiftKey) {
    return currentIndex === 0 ? total - 1 : currentIndex - 1;
  }

  return currentIndex === total - 1 ? 0 : currentIndex + 1;
}

/**
 * Moves focus to the first element and returns whether focus was moved.
 */
export function focusFirstElement(elements: FocusableElementLike[]): boolean {
  const first = elements[0];

  if (!first) {
    return false;
  }

  first.focus();
  return true;
}

/**
 * Handles Escape close and tab-cycle focus trapping for the modal.
 */
export function handleCelebrationKeyDown(
  event: KeyboardEventLike,
  options: {
    onClose: () => void;
    focusableElements: FocusableElementLike[];
    activeElement: FocusableElementLike | null;
  }
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    options.onClose();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const { focusableElements, activeElement } = options;

  if (focusableElements.length === 0) {
    return;
  }

  event.preventDefault();

  const currentIndex = activeElement ? focusableElements.indexOf(activeElement) : -1;
  const nextIndex = getNextFocusIndex(currentIndex, focusableElements.length, Boolean(event.shiftKey));

  if (nextIndex >= 0) {
    focusableElements[nextIndex]?.focus();
  }
}

function getFocusableElements(container: HTMLDivElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  const selectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selectors));
}

export function CelebrationModal({ type, onClose, questionSetName, badges = [] }: CelebrationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showConfetti, setShowConfetti] = useState(type === 'perfect-score');
  const [isClosing, setIsClosing] = useState(false);
  const titleId = useMemo(() => `celebration-title-${type}`, [type]);
  const descriptionId = useMemo(() => `celebration-description-${type}`, [type]);
  const allBadgesLabel = badges.length > 0 ? `${badges.length}` : 'kaikki';

  const handleClose = useCallback(() => {
    if (isClosing) {
      return;
    }

    setIsClosing(true);
    onClose();
  }, [isClosing, onClose]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const firstFocusable = getFocusableElements(modalRef.current);
    focusFirstElement(firstFocusable);

    return () => {
      previousFocusRef.current?.focus();
    };
  }, []);

  useEffect(() => {
    setShowConfetti(type === 'perfect-score');
    setIsClosing(false);
  }, [type]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
      removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    };
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    applyPreference();

    if ('addEventListener' in mediaQuery) {
      mediaQuery.addEventListener('change', applyPreference);
      return () => mediaQuery.removeEventListener('change', applyPreference);
    }

    legacyMediaQuery.addListener?.(applyPreference);
    return () => legacyMediaQuery.removeListener?.(applyPreference);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      handleCelebrationKeyDown(event, {
        onClose: handleClose,
        focusableElements: getFocusableElements(modalRef.current),
        activeElement: document.activeElement as FocusableElementLike | null,
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-300',
          type === 'perfect-score' ? 'bg-black/50 dark:bg-black/70' : 'bg-black/60 dark:bg-black/80'
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className={cn(
          'relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6 sm:max-w-lg sm:p-8',
          'bg-white dark:bg-slate-900',
          'shadow-2xl',
          !prefersReducedMotion && 'animate-celebration-entrance'
        )}
      >
        <div role="status" aria-live="polite" className="sr-only">
          {type === 'perfect-score' && 'Täydellinen suoritus! Sait kaikki kysymykset oikein.'}
          {type === 'all-badges' && 'Mestari suorittaja! Olet avannut kaikki merkit.'}
        </div>

        {type === 'perfect-score' && (
          <>
            {!prefersReducedMotion && showConfetti && <Confetti count={60} onComplete={() => setShowConfetti(false)} />}
            <div className="text-center">
              <h2 id={titleId} className="mb-4 text-3xl font-bold text-emerald-600 dark:text-emerald-400 md:text-4xl">
                💯 TÄYDELLINEN SUORITUS! 💯
              </h2>
              <p id={descriptionId} className="mb-6 text-lg text-slate-900 dark:text-slate-100 md:text-xl">
                Sait kaikki kysymykset oikein!
              </p>
              {questionSetName && (
                <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
                  {questionSetName}
                </p>
              )}
              <Button
                onClick={handleClose}
                size="lg"
                className="min-h-12 speed-quiz-primary focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Jatka harjoittelua
              </Button>
            </div>
          </>
        )}

        {type === 'all-badges' && (
          <>
            {!prefersReducedMotion && <Sparkles count={30} />}
            <div className="text-center">
              <div className="trophy-container mb-4">
                <div
                  className={cn(
                    'trophy-icon text-7xl drop-shadow-[0_0_20px_rgba(245,158,11,0.45)] md:text-8xl',
                    !prefersReducedMotion && 'animate-trophy-entrance'
                  )}
                >
                  🏆
                </div>
              </div>
              <h2 id={titleId} className="mb-4 text-3xl font-bold text-amber-600 dark:text-amber-400 md:text-4xl">
                MESTARI SUORITTAJA!
              </h2>
              <p id={descriptionId} className="mb-4 text-lg text-slate-900 dark:text-slate-100 md:text-xl">
                Olet avannut kaikki {allBadgesLabel} merkkiä!
              </p>
              <div className="mb-6 flex flex-wrap justify-center gap-2">
                {badges.map((badge) => (
                  <span key={badge.id} className="text-3xl">
                    {badge.emoji}
                  </span>
                ))}
              </div>
              <Button
                onClick={handleClose}
                size="lg"
                className="min-h-12 bg-amber-600 hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                Upeaa työtä!
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
