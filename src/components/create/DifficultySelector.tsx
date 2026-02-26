import { Difficulty } from '@/types';
import { DIFFICULTY_LEVELS } from '@/config/subjects';
import { SelectableCard, SelectableCardGroup } from '@/components/ui/selectable-card-group';

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
      <SelectableCardGroup className="grid-cols-2 md:grid-cols-4">
        {DIFFICULTY_LEVELS.map((level) => (
          <SelectableCard
            key={level.value}
            onSelect={() => onDifficultyChange(level.value as Difficulty)}
            isSelected={selectedDifficulty === level.value}
            label={level.label}
            description={level.description}
            className="p-4"
            labelClassName="font-semibold mb-1"
            descriptionClassName="text-xs text-gray-600"
          />
        ))}
      </SelectableCardGroup>
    </div>
  );
}
