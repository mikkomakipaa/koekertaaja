'use client';

import type { KeyboardEvent } from 'react';
import { CalendarBlank, CaretDown, CaretLeft, CaretRight, CaretUp, Clock } from '@phosphor-icons/react';
import { MathText } from '@/components/ui/math-text';
import { cn } from '@/lib/utils';

interface TimelineItem {
  text: string;
  year?: number;
}

export interface TimelineViewProps {
  items: TimelineItem[];
  currentOrder: number[];
  correctOrder: number[];
  showExplanation: boolean;
  onOrderChange: (newOrder: number[]) => void;
  disabled?: boolean;
}

type TimelineStatus = 'correct' | 'incorrect' | 'pending';

export function TimelineView({
  items,
  currentOrder,
  correctOrder,
  showExplanation,
  onOrderChange,
  disabled = false,
}: TimelineViewProps) {
  const controlsDisabled = disabled || showExplanation;
  const totalItems = currentOrder.length;

  const moveItem = (index: number, direction: -1 | 1) => {
    if (controlsDisabled) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= totalItems) return;
    const newOrder = [...currentOrder];
    [newOrder[index], newOrder[nextIndex]] = [newOrder[nextIndex], newOrder[index]];
    onOrderChange(newOrder);
  };

  const getItemStatus = (index: number): TimelineStatus => {
    if (!showExplanation) return 'pending';
    return currentOrder[index] === correctOrder[index] ? 'correct' : 'incorrect';
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    if (controlsDisabled) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      moveItem(index, -1);
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      moveItem(index, 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
        <CalendarBlank size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
        <span>Aikajana</span>
        <Clock size={18} weight="duotone" className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
      </div>

      <div className="relative">
        <div
          className={cn(
            "absolute left-3 top-4 bottom-4 w-0.5 bg-purple-200 dark:bg-purple-800",
            "sm:top-9 sm:bottom-auto sm:left-4 sm:right-4 sm:h-0.5 sm:w-auto"
          )}
          aria-hidden="true"
        />

        <div role="list" aria-label="Aikajana tapahtumille" className="flex flex-col gap-6 sm:flex-row sm:gap-4 sm:items-start sm:justify-between">
          {currentOrder.map((itemIndex, displayIndex) => {
            const item = items[itemIndex];
            const status = getItemStatus(displayIndex);
            const showYear = showExplanation && typeof item.year === 'number';
            const markerClasses = cn(
              "w-6 h-6 rounded-full border-4 flex items-center justify-center flex-shrink-0 relative z-10",
              status === 'pending' && "bg-purple-500 border-purple-100 dark:bg-purple-400 dark:border-purple-900",
              status === 'correct' && "bg-green-600 border-green-100 dark:bg-green-500 dark:border-green-900",
              status === 'incorrect' && "bg-red-600 border-red-100 dark:bg-red-500 dark:border-red-900"
            );

            return (
              <div
                key={`${itemIndex}-${displayIndex}`}
                role="listitem"
                aria-label={`Paikka ${displayIndex + 1} / ${totalItems}: ${item.text}${showYear ? `, vuosi ${item.year}` : ''}`}
                aria-posinset={displayIndex + 1}
                aria-setsize={totalItems}
                tabIndex={0}
                onKeyDown={(event) => handleKeyDown(event, displayIndex)}
                className={cn(
                  "relative flex items-start gap-3 rounded-xl border-2 p-4 bg-white dark:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60",
                  "sm:flex-1 sm:flex-col sm:items-center sm:text-center",
                  status === 'pending' && "border-gray-200 dark:border-gray-800",
                  status === 'correct' && "border-green-500/70 bg-green-50 dark:bg-green-950/40",
                  status === 'incorrect' && "border-red-500/70 bg-red-50 dark:bg-red-950/40"
                )}
              >
                <div className="flex items-center gap-2 sm:flex-col sm:gap-1">
                  {showYear && (
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 sm:text-sm">
                      {item.year}
                    </span>
                  )}
                  <div className={markerClasses} aria-hidden="true" />
                </div>

                <div className="flex-1 text-gray-900 dark:text-gray-100 sm:flex-none">
                  <MathText>{item.text}</MathText>
                </div>

                {!controlsDisabled && (
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => moveItem(displayIndex, -1)}
                      disabled={displayIndex === 0}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        displayIndex === 0
                          ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                          : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      )}
                      aria-label="Siirrä aiemmaksi"
                    >
                      <CaretUp size={18} weight="bold" className="sm:hidden" />
                      <CaretLeft size={18} weight="bold" className="hidden sm:block" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(displayIndex, 1)}
                      disabled={displayIndex === totalItems - 1}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        displayIndex === totalItems - 1
                          ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                          : "text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      )}
                      aria-label="Siirrä myöhemmäksi"
                    >
                      <CaretDown size={18} weight="bold" className="sm:hidden" />
                      <CaretRight size={18} weight="bold" className="hidden sm:block" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
