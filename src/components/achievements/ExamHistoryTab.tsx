'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Check, Minus } from '@phosphor-icons/react';
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
  const fiDateMatch = examDate.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const parsedDate = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : fiDateMatch
      ? new Date(Number(fiDateMatch[3]), Number(fiDateMatch[2]) - 1, Number(fiDateMatch[1]))
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
  sortTimestamp: number;
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

const parseSortableDate = (value?: string | null): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const fiMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const parsedDate = isoMatch
    ? new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]))
    : fiMatch
      ? new Date(Number(fiMatch[3]), Number(fiMatch[2]) - 1, Number(fiMatch[1]))
      : new Date(trimmed);

  const timestamp = parsedDate.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
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
    const titleWithDate = subtitle ? `${title} • ${subtitle}` : title;

    const byDifficulty = new Map<string, ExamHistoryEntry>();
    for (const entry of groupEntries) {
      if (!entry.difficulty) continue;
      byDifficulty.set(entry.difficulty, entry);
    }

    const helppoEntry = byDifficulty.get('helppo') ?? null;
    const normaaliEntry = byDifficulty.get('normaali') ?? null;

    const helppoPercentage = clampPercentage(helppoEntry?.lastScore?.percentage);
    const normaaliPercentage = clampPercentage(normaaliEntry?.lastScore?.percentage);
    const sortTimestamp = parseSortableDate(representative.examDate)
      ?? Math.max(...groupEntries.map((entry) => entry.sortTimestamp));

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
      title: titleWithDate,
      sortTimestamp,
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
    if (a.sortTimestamp !== b.sortTimestamp) return b.sortTimestamp - a.sortTimestamp;
    return a.title.localeCompare(b.title, 'fi');
  });
};

function DifficultyRow({
  label,
  percentage,
  scoreText,
  href,
}: {
  label: string;
  percentage: number;
  scoreText: string;
  href: string | null;
}) {
  const isMastered = percentage >= 90;
  const barColor = isMastered
    ? 'bg-emerald-500'
    : percentage >= 70
      ? 'bg-teal-500'
      : percentage >= 50
      ? 'bg-amber-500'
      : 'bg-slate-400';
  const textColor = isMastered
    ? 'text-emerald-700 dark:text-emerald-300'
    : percentage >= 70
      ? 'text-teal-700 dark:text-teal-300'
      : percentage >= 50
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-slate-600 dark:text-slate-400';

  const rowContent = (
    <div className="rounded-lg px-1 py-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-xs font-semibold ${textColor}`}>{percentage}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
        <span>{scoreText}</span>
        {href ? (
          <span className="inline-flex min-h-[32px] items-center gap-1 px-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
            Pelaa
            <ArrowRight size={12} weight="bold" aria-hidden="true" />
          </span>
        ) : (
          <span className="inline-flex min-h-[32px] items-center px-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500">
            {percentage === 100 ? <Check size={12} weight="bold" /> : <Minus size={12} weight="bold" />}
          </span>
        )}
      </div>
    </div>
  );

  if (!href) {
    return rowContent;
  }

  return (
    <Link
      href={href}
      className="block cursor-pointer rounded-lg transition-colors hover:bg-indigo-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:hover:bg-indigo-900/20"
    >
      {rowContent}
    </Link>
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
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {exam.subjectConfig.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <DifficultyRow
                  label="Helppo"
                  percentage={exam.helppo.percentage}
                  scoreText={exam.helppo.entry?.lastScore
                    ? `${exam.helppo.entry.lastScore.score}/${exam.helppo.entry.lastScore.total} oikein`
                    : 'Ei tulosta'}
                  href={exam.helppo.entry
                    ? `/play/${exam.helppo.entry.code}?mode=${getPlayMode(exam.helppo.entry.difficulty)}`
                    : null}
                />

                <DifficultyRow
                  label="Normaali"
                  percentage={exam.normaali.percentage}
                  scoreText={exam.normaali.entry?.lastScore
                    ? `${exam.normaali.entry.lastScore.score}/${exam.normaali.entry.lastScore.total} oikein`
                    : 'Ei tulosta'}
                  href={exam.normaali.entry
                    ? `/play/${exam.normaali.entry.code}?mode=${getPlayMode(exam.normaali.entry.difficulty)}`
                    : null}
                />
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
