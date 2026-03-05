'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { BookOpenText, Check, Minus } from '@phosphor-icons/react';
import { useExamHistory } from '@/hooks/useExamHistory';
import { getSubjectConfig } from '@/lib/utils/subject-config';
import { cn } from '@/lib/utils';
import type { ExamHistoryEntry } from '@/types/examHistory';

const QUIZ_DIFFICULTIES = new Set(['helppo', 'normaali', 'aikahaaste']);

const DIFFICULTY_LABELS: Record<string, string> = {
  helppo: 'Helppo',
  normaali: 'Normaali',
  aikahaaste: 'Aikahaaste',
};

const fallbackSubjectConfig = {
  icon: <BookOpenText size={20} weight="duotone" />,
  label: 'Oppiaine puuttuu',
  color: 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
};

function formatExamDate(examDate: string | null): string | null {
  if (!examDate) return null;

  const dateOnlyMatch = examDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsedDate = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(examDate);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return new Intl.DateTimeFormat('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsedDate);
}

function getDifficultyLabel(difficulty: string | null): string | null {
  if (!difficulty) return null;
  return DIFFICULTY_LABELS[difficulty] ?? null;
}

function getScorePillClasses(percentage: number | null): string {
  if (percentage === null) {
    return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }

  if (percentage >= 80) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
  }

  if (percentage >= 60) {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
  }

  return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
}

function getPlayMode(difficulty: string | null): 'pelaa' | 'opettele' {
  if (!difficulty) return 'opettele';
  return QUIZ_DIFFICULTIES.has(difficulty) ? 'pelaa' : 'opettele';
}

interface DifficultyStats {
  entry: ExamHistoryEntry | null;
  percentage: number;
  complete: boolean;
}

interface GroupedExamSummary {
  id: string;
  title: string;
  subtitle: string | null;
  subjectConfig: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  bestScore: number;
  sessionCount: number;
  helppo: DifficultyStats;
  normaali: DifficultyStats;
  playCode: string;
  playMode: 'pelaa' | 'opettele';
}

const clampPercentage = (percentage: number | null | undefined): number => {
  if (typeof percentage !== 'number' || !Number.isFinite(percentage)) return 0;
  return Math.max(0, Math.min(100, Math.round(percentage)));
};

const buildGroupKey = (entry: ExamHistoryEntry): string => {
  const subject = entry.subject?.trim().toLowerCase() ?? '';
  const examDate = entry.examDate?.trim() ?? '';
  const name = entry.name?.trim().toLowerCase() ?? '';
  return `${subject}|${examDate}|${name}`;
};

const buildGroupedExamSummaries = (entries: ExamHistoryEntry[]): GroupedExamSummary[] => {
  const groups = new Map<string, ExamHistoryEntry[]>();

  for (const entry of entries) {
    const key = buildGroupKey(entry);
    const list = groups.get(key);
    if (list) {
      list.push(entry);
    } else {
      groups.set(key, [entry]);
    }
  }

  const summaries = Array.from(groups.values()).map((groupEntries): GroupedExamSummary => {
    const representative = groupEntries[0];
    const subjectConfig = representative.subject
      ? getSubjectConfig(representative.subject)
      : fallbackSubjectConfig;
    const sanitizedName =
      representative.name && representative.name !== representative.code
        ? representative.name
        : null;
    const title = representative.subject
      ? subjectConfig.label
      : sanitizedName ?? fallbackSubjectConfig.label;
    const subtitle = formatExamDate(representative.examDate);

    const byDifficulty = new Map<string, ExamHistoryEntry>();
    for (const entry of groupEntries) {
      if (!entry.difficulty) continue;
      byDifficulty.set(entry.difficulty, entry);
    }

    const helppoEntry = byDifficulty.get('helppo') ?? null;
    const normaaliEntry = byDifficulty.get('normaali') ?? null;

    const helppoPercentage = clampPercentage(helppoEntry?.lastScore?.percentage);
    const normaaliPercentage = clampPercentage(normaaliEntry?.lastScore?.percentage);

    const bestScore = Math.max(
      ...groupEntries.map((entry) => clampPercentage(entry.lastScore?.percentage))
    );
    const sessionCount = groupEntries.filter((entry) => entry.lastScore).length;

    const recommendedEntry = helppoPercentage < 80
      ? (helppoEntry ?? normaaliEntry)
      : (normaaliEntry ?? helppoEntry);
    const fallbackEntry = recommendedEntry ?? groupEntries[0];

    return {
      id: `${representative.code}-${representative.sortTimestamp}`,
      title,
      subtitle,
      subjectConfig,
      bestScore,
      sessionCount,
      helppo: {
        entry: helppoEntry,
        percentage: helppoPercentage,
        complete: helppoPercentage === 100,
      },
      normaali: {
        entry: normaaliEntry,
        percentage: normaaliPercentage,
        complete: normaaliPercentage === 100,
      },
      playCode: fallbackEntry.code,
      playMode: getPlayMode(fallbackEntry.difficulty),
    };
  });

  return summaries.sort((a, b) => {
    if (a.bestScore !== b.bestScore) return a.bestScore - b.bestScore;
    return b.sessionCount - a.sessionCount;
  });
};

function DifficultyRow({
  label,
  percentage,
  complete,
}: {
  label: string;
  percentage: number;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-2 rounded-full bg-indigo-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">{percentage}%</span>
      <span className="inline-flex w-5 justify-center">
        {complete ? (
          <Check size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Minus size={14} weight="bold" className="text-slate-400 dark:text-slate-500" />
        )}
      </span>
    </div>
  );
}

export function ExamHistoryTab() {
  const { entries, isEmpty } = useExamHistory();
  const groupedEntries = useMemo(() => buildGroupedExamSummaries(entries), [entries]);

  if (isEmpty) {
    return (
      <div className="rounded-xl border border-gray-200 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
        Pelaa yksi harjoituskierros, niin koetulokset ilmestyvät tänne.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedEntries.map((exam) => {
        return (
          <article
            key={exam.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-none transition-shadow duration-150 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-md', exam.subjectConfig.color)}>
                  {exam.subjectConfig.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </p>
                  {exam.subtitle && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{exam.subtitle}</p>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300">
                Paras tulos {exam.bestScore}% • Sessioita {exam.sessionCount}
              </p>

              <div className="space-y-2">
                <DifficultyRow
                  label="Helppo"
                  percentage={exam.helppo.percentage}
                  complete={exam.helppo.complete}
                />

                <div className="ml-8 h-4 w-px bg-slate-300 dark:bg-slate-600" />

                <DifficultyRow
                  label="Normaali"
                  percentage={exam.normaali.percentage}
                  complete={exam.normaali.complete}
                />
              </div>

              <div className="flex justify-end">
                <Link
                  href={`/play/${exam.playCode}?mode=${exam.playMode}`}
                  className="text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Pelaa →
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
