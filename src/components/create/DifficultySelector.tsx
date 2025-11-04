import { Difficulty } from '@/types';
import { DIFFICULTY_LEVELS } from '@/config/subjects';
import { cn } from '@/lib/utils';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

export function DifficultySelector({
  selectedDifficulty,
  onDifficultyChange,
}: DifficultySelectorProps) {
  return (
    <div>
      <label className="block text-lg font-bold mb-3 text-gray-800">
        🎯 Valitse vaikeustaso
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DIFFICULTY_LEVELS.map((level) => (
          <button
            key={level.value}
            onClick={() => onDifficultyChange(level.value as Difficulty)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all",
              selectedDifficulty === level.value
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
            )}
          >
            <div className="font-semibold mb-1">{level.label}</div>
            <div className="text-xs text-gray-600">{level.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
