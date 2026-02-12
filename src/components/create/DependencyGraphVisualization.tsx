'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { Question } from '@/types';
import { dependencyResolver } from '@/lib/utils/dependencyGraph';

interface DependencyGraphVisualizationProps {
  subject: string;
  grade?: number;
  questions: Question[];
}

export function DependencyGraphVisualization({
  subject,
  grade,
  questions,
}: DependencyGraphVisualizationProps) {
  if (questions.length === 0) {
    return null;
  }

  const conceptRows = questions
    .map((question, index) => {
      const conceptId = dependencyResolver.extractConceptIdFromQuestion(subject, {
        concept_id: question.concept_id,
        subtopic: question.subtopic,
        skill: question.skill,
        topic: question.topic,
      });

      if (!conceptId) {
        return null;
      }

      return {
        conceptId,
        order: index,
      };
    })
    .filter((entry): entry is { conceptId: string; order: number } => Boolean(entry));

  if (conceptRows.length === 0) {
    return (
      <Alert>
        <AlertTitle>Konseptiriippuvuudet</AlertTitle>
        <AlertDescription>
          Riippuvuusgraafi on käytössä, mutta nykyisistä kysymyksistä ei löytynyt konsepti-ID:tä.
        </AlertDescription>
      </Alert>
    );
  }

  const validation = dependencyResolver.validateQuestionSet(subject, conceptRows, { grade });

  if (validation.valid) {
    return (
      <Alert className="border-green-200 bg-green-50 text-green-900 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-100">
        <AlertTitle>Edellytysjärjestys kunnossa</AlertTitle>
        <AlertDescription>
          Kaikki tunnistetut konseptit etenevät pedagogisesti oikeassa järjestyksessä.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTitle>Riippuvuusvirheitä havaittu ({validation.violations.length})</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-5 space-y-1">
          {validation.violations.slice(0, 5).map((violation, index) => (
            <li key={`${violation.concept}-${violation.missingPrereq}-${index}`}>
              Kysymys {violation.question + 1}: <code>{violation.concept}</code> vaatii ensin{' '}
              <code>{violation.missingPrereq}</code>
            </li>
          ))}
          {validation.violations.length > 5 && (
            <li>... ja {validation.violations.length - 5} muuta rikkomusta.</li>
          )}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
