import { GRADE_LEVELS } from '@/config/subjects';
import { cn } from '@/lib/utils';
import { SelectableCard, SelectableCardGroup } from '@/components/ui/selectable-card-group';
import { GraduationCap } from '@phosphor-icons/react';

interface GradeSelectorProps {
  selectedGrade?: number;
  onGradeChange: (grade?: number) => void;
  required?: boolean;
}

export function GradeSelector({ selectedGrade, onGradeChange, required = false }: GradeSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-bold mb-3 text-gray-800">
        <span className="inline-flex items-center gap-2">
          <GraduationCap weight="duotone" className="w-5 h-5 text-indigo-600" />
          Valitse luokka-aste {required ? '(pakollinen)' : '(valinnainen)'}
        </span>
      </label>
      <SelectableCardGroup className={cn(required ? "grid-cols-3" : "grid-cols-4")}>
        {!required && (
          <SelectableCard
            onSelect={() => onGradeChange(undefined)}
            isSelected={!selectedGrade}
            label="Ei valittu"
            className="p-3 font-semibold"
          />
        )}
        {GRADE_LEVELS.map((grade) => (
          <SelectableCard
            key={grade.value}
            onSelect={() => onGradeChange(grade.value)}
            isSelected={selectedGrade === grade.value}
            label={grade.label}
            className="p-3 font-semibold"
          />
        ))}
      </SelectableCardGroup>
    </div>
  );
}
