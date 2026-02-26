import { Subject } from '@/types';
import { getEnabledSubjects } from '@/config/subjects';
import { SelectableCard, SelectableCardGroup } from '@/components/ui/selectable-card-group';

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
      <SelectableCardGroup className="grid-cols-2 md:grid-cols-4">
        {subjects.map((subject) => (
          <SelectableCard
            key={subject.id}
            onSelect={() => onSubjectChange(subject.id)}
            isSelected={selectedSubject === subject.id}
            icon={subject.icon}
            label={subject.name}
            className="p-4 font-semibold"
            iconClassName="text-2xl mb-1"
            labelClassName="text-sm"
          />
        ))}
      </SelectableCardGroup>
    </div>
  );
}
