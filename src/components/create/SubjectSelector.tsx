import { Subject } from '@/types';
import { getEnabledSubjects } from '@/config/subjects';
import { cn } from '@/lib/utils';

interface SubjectSelectorProps {
  selectedSubject: Subject;
  onSubjectChange: (subject: Subject) => void;
}

export function SubjectSelector({ selectedSubject, onSubjectChange }: SubjectSelectorProps) {
  const subjects = getEnabledSubjects();

  return (
    <div>
      <label className="block text-lg font-bold mb-3 text-gray-800">
        📚 Valitse aine
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSubjectChange(subject.id)}
            className={cn(
              "p-4 rounded-lg border-2 transition-all font-semibold",
              selectedSubject === subject.id
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
            )}
          >
            <div className="text-2xl mb-1">{subject.icon}</div>
            <div className="text-sm">{subject.name}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
