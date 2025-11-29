'use client';

import { StudyMode } from '@/types';
import { GameController, Book } from '@phosphor-icons/react';

interface ModeToggleProps {
  currentMode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('pelaa')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              currentMode === 'pelaa'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <GameController size={20} weight={currentMode === 'pelaa' ? 'fill' : 'regular'} />
            Pelaa
          </button>
          <button
            onClick={() => onModeChange('opettele')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
              currentMode === 'opettele'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Book size={20} weight={currentMode === 'opettele' ? 'fill' : 'regular'} />
            Opettele
          </button>
        </div>
      </div>
    </div>
  );
}
