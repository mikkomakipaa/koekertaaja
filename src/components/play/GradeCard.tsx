import { Trophy } from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getResultsPerformanceBand, getSchoolGrade } from '@/lib/play/results-screen';

interface GradeCardProps {
  score: number;
  total: number;
  title?: string | null;
  difficultyLabel?: string | null;
  mode?: 'quiz' | 'flashcard';
}

const bandClasses = {
  weak: 'border-amber-300/80 bg-amber-50/90 text-amber-950 dark:border-amber-700/70 dark:bg-amber-950/35 dark:text-amber-50',
  mid: 'border-sky-300/80 bg-sky-50/90 text-sky-950 dark:border-sky-700/70 dark:bg-sky-950/35 dark:text-sky-50',
  strong: 'border-emerald-300/80 bg-emerald-50/90 text-emerald-950 dark:border-emerald-700/70 dark:bg-emerald-950/35 dark:text-emerald-50',
} as const;

const iconClasses = {
  weak: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
  mid: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200',
  strong: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200',
} as const;

export function GradeCard({
  score,
  total,
  title,
  difficultyLabel,
  mode = 'quiz',
}: GradeCardProps) {
  const grade = getSchoolGrade(score, total);
  const band = getResultsPerformanceBand(score, total);
  const meta = [title, difficultyLabel].filter(Boolean).join(' • ');

  return (
    <Card
      variant="standard"
      padding="none"
      className={cn('rounded-xl shadow-none', bandClasses[band])}
      data-testid="results-grade-card"
    >
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-current/70">
              {mode === 'quiz' ? 'Kierroksen tulos' : 'Harjoituksen tulos'}
            </p>
            {meta ? (
              <p className="text-sm font-medium text-current/80">{meta}</p>
            ) : null}
            <div className="flex items-end gap-3">
              <p className="text-5xl font-semibold leading-none tracking-tight sm:text-6xl">
                {grade.label}
              </p>
              <div className="pb-1">
                <p className="text-sm font-semibold text-current/80">Arvosana</p>
                <p className="text-sm text-current/70">{score} / {total} oikein</p>
              </div>
            </div>
          </div>
          <div className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', iconClasses[band])}>
            <Trophy size={24} weight="duotone" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
