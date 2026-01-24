import { GRADE_LEVELS } from '@/config/subjects';
import { cn } from '@/lib/utils';
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
      <div className={cn("grid gap-3", required ? "grid-cols-3" : "grid-cols-4")}>
        {!required && (
          <button
            onClick={() => onGradeChange(undefined)}
            className={cn(
              "p-3 rounded-lg border-2 transition-all font-semibold",
              !selectedGrade
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
            )}
          >
            Ei valittu
          </button>
        )}
        {GRADE_LEVELS.map((grade) => (
          <button
            key={grade.value}
            onClick={() => onGradeChange(grade.value)}
            className={cn(
              "p-3 rounded-lg border-2 transition-all font-semibold",
              selectedGrade === grade.value
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
            )}
          >
            {grade.label}
          </button>
        ))}
      </div>
    </div>
  );
}
