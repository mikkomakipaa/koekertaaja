import { GRADE_LEVELS } from '@/config/subjects';
import { cn } from '@/lib/utils';

interface GradeSelectorProps {
  selectedGrade?: number;
  onGradeChange: (grade?: number) => void;
}

export function GradeSelector({ selectedGrade, onGradeChange }: GradeSelectorProps) {
  return (
    <div>
      <label className="block text-lg font-bold mb-3 text-gray-800">
        🎓 Valitse luokka-aste (valinnainen)
      </label>
      <div className="grid grid-cols-4 gap-3">
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
