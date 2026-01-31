import { MatchingQuestion, MatchingPair } from '@/types';
import { useState, useEffect, useRef, useCallback } from 'react';
import { shuffleArray } from '@/lib/utils';
import { MathText } from '@/components/ui/math-text';
import { CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface MatchingProps {
  question: MatchingQuestion;
  userMatches: Record<string, string>;
  showExplanation: boolean;
  onMatchChange: (matches: Record<string, string>) => void;
}

type RectLike = Pick<DOMRect, 'left' | 'right' | 'top' | 'height'>;
type RectProvider = { getBoundingClientRect: () => RectLike };

type DebouncedCallback = (() => void) & { cancel: () => void };

export interface ConnectionPosition {
  leftId: string;
  rightId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const createDebouncedCallback = (callback: () => void, delay: number): DebouncedCallback => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      callback();
    }, delay);
  }) as DebouncedCallback;

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
};

export const calculateConnectionPositions = (
  matches: Record<string, string>,
  leftElements: Record<string, RectProvider | null | undefined>,
  rightElements: Record<string, RectProvider | null | undefined>,
  options: { scrollX?: number; scrollY?: number; containerRect?: RectLike } = {}
): ConnectionPosition[] => {
  const scrollX = options.scrollX ?? 0;
  const scrollY = options.scrollY ?? 0;
  const baseLeft = options.containerRect ? options.containerRect.left : -scrollX;
  const baseTop = options.containerRect ? options.containerRect.top : -scrollY;

  return Object.entries(matches).flatMap(([leftId, rightId]) => {
    const leftElement = leftElements[leftId];
    const rightElement = rightElements[rightId];
    if (!leftElement || !rightElement) return [];

    const leftRect = leftElement.getBoundingClientRect();
    const rightRect = rightElement.getBoundingClientRect();

    return [
      {
        leftId,
        rightId,
        x1: leftRect.right - baseLeft,
        y1: leftRect.top + leftRect.height / 2 - baseTop,
        x2: rightRect.left - baseLeft,
        y2: rightRect.top + rightRect.height / 2 - baseTop,
      },
    ];
  });
};

const getItemId = (side: 'left' | 'right', value: string) =>
  `${side}-${encodeURIComponent(value)}`;

export function Matching({
  question,
  userMatches,
  showExplanation,
  onMatchChange,
}: MatchingProps) {
  const [shuffledRights, setShuffledRights] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [connectionPositions, setConnectionPositions] = useState<ConnectionPosition[]>([]);
  const leftItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Shuffle right options once on mount
    if (question.pairs && question.pairs.length > 0) {
      setShuffledRights(shuffleArray(question.pairs.map(p => p.right)));
    }
  }, [question.pairs]);

  const handleLeftClick = (left: string) => {
    if (showExplanation) return;
    setSelectedLeft(left);
  };

  const handleRightClick = (right: string) => {
    if (showExplanation || !selectedLeft) return;

    const newMatches = { ...userMatches, [selectedLeft]: right };
    onMatchChange(newMatches);
    setSelectedLeft(null);
  };

  const getMatchStatus = (left: string) => {
    if (!showExplanation || !userMatches[left]) return null;
    const correctRight = question.pairs.find(p => p.left === left)?.right;
    return userMatches[left] === correctRight;
  };

  const updateConnectionPositions = useCallback(() => {
    if (typeof window === 'undefined') return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    setConnectionPositions(
      calculateConnectionPositions(userMatches, leftItemRefs.current, rightItemRefs.current, {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        containerRect,
      })
    );
  }, [userMatches]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      updateConnectionPositions();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [updateConnectionPositions, shuffledRights]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = createDebouncedCallback(updateConnectionPositions, 250);

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleResize);

    return () => {
      handleResize.cancel();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
      document.removeEventListener('visibilitychange', handleResize);
    };
  }, [updateConnectionPositions]);

  // Safety check for empty or missing pairs
  if (!question.pairs || question.pairs.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Virhe: Kysymyksellä ei ole yhdistettäviä pareja.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
        Yhdistä vasen ja oikea puoli klikkaamalla ensin vasenta, sitten oikeaa.
      </p>

      <div ref={containerRef} className="relative">
        <svg
          className="pointer-events-none absolute inset-0 hidden md:block z-10"
          width="100%"
          height="100%"
          aria-hidden="true"
        >
          {connectionPositions.map((connection) => (
            <line
              key={`${connection.leftId}-${connection.rightId}`}
              x1={connection.x1}
              y1={connection.y1}
              x2={connection.x2}
              y2={connection.y2}
              stroke="rgb(59, 130, 246)"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          ))}
        </svg>

        <div className="grid grid-cols-2 gap-4 relative z-20">
          {/* Left column */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Vasen</h4>
            {question.pairs.map((pair) => {
              const isSelected = selectedLeft === pair.left;
              const matchStatus = getMatchStatus(pair.left);

            return (
              <div key={pair.left} className="space-y-1">
                <button
                  id={getItemId('left', pair.left)}
                  ref={(node) => {
                    if (node) {
                      leftItemRefs.current[pair.left] = node;
                    } else {
                      delete leftItemRefs.current[pair.left];
                    }
                  }}
                  onClick={() => handleLeftClick(pair.left)}
                  disabled={showExplanation}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border-2 transition-all text-gray-900 dark:text-gray-100",
                    isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900 dark:border-blue-400",
                    !isSelected && !showExplanation && "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500",
                    showExplanation && matchStatus === true && "border-green-500 bg-green-50 dark:bg-green-900 dark:border-green-400",
                    showExplanation && matchStatus === false && "border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400",
                    showExplanation ? "cursor-default" : "cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <MathText>{pair.left}</MathText>
                    </span>
                    {showExplanation && matchStatus !== null && (
                      matchStatus ? (
                        <CheckCircle weight="duotone" className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle weight="duotone" className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )
                    )}
                  </div>
                </button>
                {userMatches[pair.left] && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                    → <MathText>{userMatches[pair.left]}</MathText>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Right column */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Oikea</h4>
            {shuffledRights.map((right) => {
              const isUsed = Object.values(userMatches).includes(right);

              return (
                <button
                  key={right}
                  id={getItemId('right', right)}
                  ref={(node) => {
                    if (node) {
                      rightItemRefs.current[right] = node;
                    } else {
                      delete rightItemRefs.current[right];
                    }
                  }}
                  onClick={() => handleRightClick(right)}
                  disabled={showExplanation || !selectedLeft}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border-2 transition-all text-gray-900 dark:text-gray-100",
                    isUsed && "opacity-50",
                    !isUsed && selectedLeft && !showExplanation && "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900",
                    !selectedLeft && "border-gray-200 dark:border-gray-700 cursor-not-allowed",
                    showExplanation && "cursor-default border-gray-200 dark:border-gray-700"
                  )}
                >
                  <MathText>{right}</MathText>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {showExplanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Oikeat vastaukset:</p>
          <div className="space-y-1">
            {question.pairs.map((pair) => (
              <p key={pair.left} className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">
                  <MathText>{pair.left}</MathText>
                </span>
                {' → '}
                <span className="font-medium">
                  <MathText>{pair.right}</MathText>
                </span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
