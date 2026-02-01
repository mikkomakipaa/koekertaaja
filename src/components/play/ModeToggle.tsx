'use client';

import { StudyMode } from '@/types';
import { GameController, Book } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  className?: string;
}

export function ModeToggle({ currentMode, onModeChange, className }: ModeToggleProps) {
  return (
    <div
      className={cn(
        'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 transition-shadow duration-150',
        className
      )}
    >
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('pelaa')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-150 ${
              currentMode === 'pelaa'
                ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg ring-2 ring-indigo-400 dark:ring-indigo-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-current={currentMode === 'pelaa' ? 'page' : undefined}
          >
            <GameController size={20} weight={currentMode === 'pelaa' ? 'fill' : 'regular'} />
            Pelaa
          </button>
          <button
            onClick={() => onModeChange('opettele')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-150 ${
              currentMode === 'opettele'
                ? 'bg-teal-600 dark:bg-teal-500 text-white shadow-lg ring-2 ring-teal-400 dark:ring-teal-300'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            aria-current={currentMode === 'opettele' ? 'page' : undefined}
          >
            <Book size={20} weight={currentMode === 'opettele' ? 'fill' : 'regular'} />
            Opettele
          </button>
        </div>
      </div>
    </div>
  );
}
