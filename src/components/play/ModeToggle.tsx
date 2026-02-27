'use client';

import { StudyMode } from '@/types';
import { GameController, Book } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/design-tokens';

interface ModeToggleProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  className?: string;
}

export function ModeToggle({ currentMode, onModeChange, className }: ModeToggleProps) {
  const modeButtonBase =
    'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900';

  const modeFocusRing = (mode: StudyMode): string => {
    if (mode === 'pelaa') return 'focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400';
    return 'focus-visible:ring-teal-500 dark:focus-visible:ring-teal-400';
  };

  const modeClasses = (mode: StudyMode): string => {
    if (currentMode !== mode) {
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700';
    }

    if (mode === 'pelaa') {
      return `text-white shadow-md ring-2 ${colors.quiz.primary} ${colors.quiz.ring}`;
    }
    return `text-white shadow-md ring-2 ${colors.study.primary} ${colors.study.ring}`;
  };

  return (
    <div
      className={cn(
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-shadow duration-150',
        className
      )}
    >
      <div className="mx-auto max-w-4xl px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('pelaa')}
            className={`${modeButtonBase} ${modeFocusRing('pelaa')} ${modeClasses('pelaa')}`}
            aria-current={currentMode === 'pelaa' ? 'page' : undefined}
            aria-label="Pelaa"
          >
            <GameController size={20} weight={currentMode === 'pelaa' ? 'fill' : 'regular'} />
            <span className="hidden sm:inline">Pelaa</span>
          </button>
          <button
            onClick={() => onModeChange('opettele')}
            className={`${modeButtonBase} ${modeFocusRing('opettele')} ${modeClasses('opettele')}`}
            aria-current={currentMode === 'opettele' ? 'page' : undefined}
            aria-label="Opettele"
          >
            <Book size={20} weight={currentMode === 'opettele' ? 'fill' : 'regular'} />
            <span className="hidden sm:inline">Opettele</span>
          </button>
        </div>
      </div>
    </div>
  );
}
