'use client';

import { Badge } from '@/components/ui/badge';
import type { Question } from '@/types';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';

interface ConceptDependencyIndicatorProps {
  subject: string;
  question: Question;
}

export function ConceptDependencyIndicator({ subject, question }: ConceptDependencyIndicatorProps) {
  const conceptId = dependencyResolver.extractConceptIdFromQuestion(subject, {
    concept_id: question.concept_id,
    subtopic: question.subtopic,
    skill: question.skill,
    topic: question.topic,
  });

  if (!conceptId) {
    return (
      <Badge variant="outline" size="xs" className="text-[10px]">
        Ei konsepti-ID:tä
      </Badge>
    );
  }

  const prerequisites = Array.from(dependencyResolver.getAllPrerequisites(subject, conceptId));

  if (prerequisites.length === 0) {
    return (
      <Badge variant="default" semantic="success" size="xs" className="text-[10px]">
        Perustava konsepti
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Badge variant="default" semantic="warning" size="xs" className="text-[10px]">
        Vaatii
      </Badge>
      {prerequisites.slice(0, 2).map((prerequisite) => (
        <Badge key={prerequisite} variant="outline" size="xs" className="text-[10px]">
          {prerequisite}
        </Badge>
      ))}
      {prerequisites.length > 2 && (
        <span className="text-[10px] text-gray-500 dark:text-gray-400">+{prerequisites.length - 2}</span>
      )}
    </div>
  );
}
