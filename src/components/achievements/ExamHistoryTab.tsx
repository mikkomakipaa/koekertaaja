'use client';

import { useMemo, type ReactNode } from 'react';
import Link from 'next/link.js';
import { ArrowRight, BookOpenText } from '@phosphor-icons/react';
import { useExamHistory } from '@/hooks/useExamHistory';
import { getSubjectConfig } from '@/lib/utils/subject-config';
import { getSchoolGrade } from '@/lib/play/results-screen';
import { getGradeColors } from '@/lib/utils/grade-colors';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { ExamHistoryEntry } from '@/types/examHistory';

const QUIZ_DIFFICULTIES = new Set(['helppo', 'normaali', 'aikahaaste']);

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

function getPlayMode(difficulty: string | null): 'pelaa' | 'opettele' {
  if (!difficulty) return 'opettele';
  return QUIZ_DIFFICULTIES.has(difficulty) ? 'pelaa' : 'opettele';
}

interface DifficultyStats {
  entry: ExamHistoryEntry | null;
  gradeLabel: string | null;
  gradeValue: number | null;
  scoreText: string;
  href: string;
}

interface GroupedExamSummary {
  id: string;
  title: string;
  displayDate: string | null;
  sortTimestamp: number;
  subjectConfig: {
    icon: ReactNode;
    label: string;
    color: string;
  };
  helppo: DifficultyStats;
  normaali: DifficultyStats;
}

type DifficultyRowTone = 'empty' | 'fail' | 'pass' | 'perfect';

export interface DifficultyRowPresentation {
  tone: DifficultyRowTone;
  containerClassName: string;
  gradeClassName: string;
  actionClassName: string;
}

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

const getGradeValueFromLabel = (gradeLabel: string | null): number | null => {
  if (!gradeLabel) return null;

  if (gradeLabel === '10') return 10;

  const numeric = Number.parseFloat(gradeLabel.replace('+', '.25').replace('-', '.75'));
  return Number.isFinite(numeric) ? numeric : null;
};

const getDifficultyStats = (
  entry: ExamHistoryEntry | null,
  fallbackCode: string,
  fallbackMode: 'pelaa' | 'opettele'
): DifficultyStats => {
  const gradeLabel = entry?.lastScore
    ? getSchoolGrade(entry.lastScore.score, entry.lastScore.total).label
    : null;
  const gradeValue = getGradeValueFromLabel(gradeLabel);

  return {
    entry,
    gradeLabel,
    gradeValue,
    scoreText: entry?.lastScore
      ? `${entry.lastScore.score}/${entry.lastScore.total} oikein`
      : 'Ei tulosta',
    href: entry
      ? `/play/${entry.code}?mode=${getPlayMode(entry.difficulty)}`
      : `/play/${fallbackCode}?mode=${fallbackMode}`,
  };
};

export function getDifficultyRowPresentation(
  gradeLabel: string | null,
  gradeValue: number | null
): DifficultyRowPresentation {
  if (!gradeLabel || gradeValue == null) {
    return {
      tone: 'empty',
      containerClassName: 'border-slate-200/80 bg-slate-50/85 dark:border-slate-700/80 dark:bg-slate-800/55',
      gradeClassName: 'text-slate-400 dark:text-slate-500',
      actionClassName: 'text-slate-500 hover:bg-slate-200/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/80 dark:hover:text-slate-200',
    };
  }

  if (gradeValue >= 10) {
    return {
      tone: 'perfect',
      containerClassName: 'border-emerald-300/80 bg-emerald-50/90 ring-1 ring-emerald-200/80 dark:border-emerald-700/70 dark:bg-emerald-950/35 dark:ring-emerald-800/60',
      gradeClassName: 'text-emerald-700 dark:text-emerald-300',
      actionClassName: 'text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100',
    };
  }

  if (gradeValue < 6) {
    return {
      tone: 'fail',
      containerClassName: 'border-amber-300/80 bg-amber-50/90 dark:border-amber-700/70 dark:bg-amber-950/30',
      gradeClassName: 'text-amber-700 dark:text-amber-300',
      actionClassName: 'text-amber-700 hover:bg-amber-100/80 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/60 dark:hover:text-amber-100',
    };
  }

  return {
    tone: 'pass',
    containerClassName: 'border-emerald-200/80 bg-emerald-50/65 dark:border-emerald-800/70 dark:bg-emerald-950/20',
    gradeClassName: 'text-emerald-700 dark:text-emerald-300',
    actionClassName: 'text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/60 dark:hover:text-emerald-100',
  };
}

export const buildGroupedExamSummaries = (entries: ExamHistoryEntry[]): GroupedExamSummary[] => {
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
    const displayDate = formatExamDate(representative.examDate);

    const byDifficulty = new Map<string, ExamHistoryEntry>();
    for (const entry of groupEntries) {
      if (!entry.difficulty) continue;
      byDifficulty.set(entry.difficulty, entry);
    }

    const helppoEntry = byDifficulty.get('helppo') ?? null;
    const normaaliEntry = byDifficulty.get('normaali') ?? null;

    const sortTimestamp = parseSortableDate(representative.examDate)
      ?? Math.max(...groupEntries.map((entry) => entry.sortTimestamp));

    const helppoPercentage = helppoEntry?.lastScore?.percentage ?? 0;
    const recommendedEntry = helppoPercentage < 80
      ? (helppoEntry ?? normaaliEntry)
      : (normaaliEntry ?? helppoEntry);
    const fallbackEntry = recommendedEntry ?? groupEntries[0];
    const helppo = getDifficultyStats(helppoEntry, fallbackEntry.code, getPlayMode(fallbackEntry.difficulty));
    const normaali = getDifficultyStats(normaaliEntry, fallbackEntry.code, getPlayMode(fallbackEntry.difficulty));

    return {
      id: `${representative.code}-${representative.sortTimestamp}`,
      title,
      displayDate,
      sortTimestamp,
      subjectConfig,
      helppo,
      normaali,
    };
  });

  return summaries.sort((a, b) => {
    if (a.sortTimestamp !== b.sortTimestamp) return b.sortTimestamp - a.sortTimestamp;
    return a.title.localeCompare(b.title, 'fi');
  });
};

function DifficultyRow({
  label,
  gradeLabel,
  gradeValue,
  scoreText,
  href,
}: {
  label: string;
  gradeLabel: string | null;
  gradeValue: number | null;
  scoreText: string;
  href: string;
}) {
  const presentation = getDifficultyRowPresentation(gradeLabel, gradeValue);
  const isPerfectGrade = gradeValue != null && gradeValue >= 10;
  const gradeInteger = gradeValue == null ? null : Math.max(4, Math.min(9, Math.floor(gradeValue)));
  const gradeColors = gradeInteger == null || isPerfectGrade ? null : getGradeColors(gradeInteger);

  const rowContent = (
    <div
      data-tone={presentation.tone}
      className={cn(
        'rounded-2xl border px-3.5 py-3.5 transition-colors',
        presentation.containerClassName
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-[3.25rem] shrink-0 self-center">
            <p
              className={cn(
                'text-[1.75rem] font-black leading-none tracking-[-0.04em]',
                presentation.gradeClassName,
                gradeColors?.text
              )}
            >
              {gradeLabel ?? '–'}
            </p>
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              {label}
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {scoreText}
            </p>
          </div>
        </div>
        <Badge
          size="xs"
          className={cn('min-h-[32px] gap-1 px-2.5 text-[11px]', presentation.actionClassName)}
        >
          Pelaa
          <ArrowRight size={12} weight="bold" aria-hidden="true" />
        </Badge>
      </div>
    </div>
  );

  return (
    <Link
      href={href}
      className="block cursor-pointer rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
    >
      {rowContent}
    </Link>
  );
}

export function ExamHistoryTab() {
  const { entries, isEmpty } = useExamHistory();
  const groupedEntries = useMemo(() => buildGroupedExamSummaries(entries), [entries]);

  return <ExamHistoryTabContent groupedEntries={groupedEntries} isEmpty={isEmpty} />;
}

export function ExamHistoryTabContent({
  groupedEntries,
  isEmpty,
}: {
  groupedEntries: GroupedExamSummary[];
  isEmpty: boolean;
}) {
  if (isEmpty) {
    return (
      <Card
        variant="standard"
        padding="large"
        className="rounded-xl border-gray-200 text-center text-sm text-gray-600 shadow-none dark:border-gray-700 dark:text-gray-300"
      >
        Pelaa yksi harjoituskierros, niin koetulokset ilmestyvät tänne.
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {groupedEntries.map((exam) => {
        return (
          <Card
            key={exam.id}
            variant="standard"
            padding="compact"
            className="rounded-2xl border-slate-200 shadow-none dark:border-slate-700 dark:bg-slate-900 hover:shadow-sm"
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${exam.subjectConfig.color}`}>
                  {exam.subjectConfig.icon}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                    {exam.title}
                  </p>
                  {exam.displayDate ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {exam.displayDate}
                  </p>
                ) : null}
              </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-white/[0.08]">
                <DifficultyRow
                  label="Helppo"
                  gradeLabel={exam.helppo.gradeLabel}
                  gradeValue={exam.helppo.gradeValue}
                  scoreText={exam.helppo.scoreText}
                  href={exam.helppo.href}
                />

                <DifficultyRow
                  label="Normaali"
                  gradeLabel={exam.normaali.gradeLabel}
                  gradeValue={exam.normaali.gradeValue}
                  scoreText={exam.normaali.scoreText}
                  href={exam.normaali.href}
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
