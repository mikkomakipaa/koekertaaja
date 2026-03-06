'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapTrifold } from '@phosphor-icons/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TopicMasteryDisplay } from '@/components/play/TopicMasteryDisplay';
import { colors } from '@/lib/design-tokens';
import { formatPracticedSetDropdownLabel, listPracticedSetDropdownItemsFromStorage } from '@/lib/mindMap/storage';
import type { QuestionSetWithQuestions } from '@/types';
import type { PracticedSetDropdownItem } from '@/types/mindMap';

interface AchievementsMapSectionProps {
  initialItems?: PracticedSetDropdownItem[];
  loadQuestionSetByCode?: (
    code: string
  ) => Promise<{ questionSet: QuestionSetWithQuestions | null; relatedFlashcardCode: string | null }>;
}

interface QuestionSetByCodeResponse {
  data?: (QuestionSetWithQuestions & { relatedFlashcardCode?: string | null });
  relatedFlashcardCode?: string | null;
}

const formatExamDateLabel = (examDate?: string | null): string | null => {
  if (!examDate) return null;

  const dateOnlyMatch = examDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const parsed = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(examDate);

  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
};

const parseSortableDate = (value?: string | null): number | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;

  const fiMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const parsed = fiMatch
    ? new Date(Number(fiMatch[3]), Number(fiMatch[2]) - 1, Number(fiMatch[1]))
    : new Date(trimmed);

  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const defaultLoadQuestionSetByCode = async (
  code: string
): Promise<{ questionSet: QuestionSetWithQuestions | null; relatedFlashcardCode: string | null }> => {
  try {
    const response = await fetch(
      `/api/question-sets?code=${encodeURIComponent(code)}&relatedFlashcard=1`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }
    );
    if (!response.ok) {
      return { questionSet: null, relatedFlashcardCode: null };
    }

    const payload = (await response.json()) as QuestionSetByCodeResponse;
    return {
      questionSet: payload.data ?? null,
      relatedFlashcardCode:
        payload.relatedFlashcardCode
        ?? payload.data?.relatedFlashcardCode
        ?? null,
    };
  } catch {
    return { questionSet: null, relatedFlashcardCode: null };
  }
};

export function AchievementsMapSection({
  initialItems,
  loadQuestionSetByCode = defaultLoadQuestionSetByCode,
}: AchievementsMapSectionProps) {
  const [items, setItems] = useState<PracticedSetDropdownItem[]>(initialItems ?? []);
  const [selectedCode, setSelectedCode] = useState<string>(() => initialItems?.[0]?.code ?? '');
  const [relatedFlashcardCodes, setRelatedFlashcardCodes] = useState<Record<string, string | null>>({});

  const selectableItems = useMemo(() => {
    return items
      .filter((item) => {
      const code = item.code.trim().toUpperCase();
      const label = item.label?.trim() ?? '';
      const hasMetadata = Boolean(item.subject?.trim() || item.examDate?.trim() || item.difficulty?.trim() || item.grade?.trim());
      const labelLooksLikeCode = label.length > 0 && label.toUpperCase() === code;
      return hasMetadata || (label.length > 0 && !labelLooksLikeCode);
      })
      .sort((a, b) => {
        const aDate = parseSortableDate(a.examDate) ?? a.practicedAt ?? 0;
        const bDate = parseSortableDate(b.examDate) ?? b.practicedAt ?? 0;
        if (aDate !== bDate) return bDate - aDate;
        return a.code.localeCompare(b.code, 'fi');
      });
  }, [items]);

  useEffect(() => {
    if (initialItems) return;
    const nextItems = listPracticedSetDropdownItemsFromStorage();
    setItems(nextItems);
    setSelectedCode((currentCode) => currentCode || nextItems[0]?.code || '');
  }, [initialItems]);

  useEffect(() => {
    if (items.length === 0) return;

    const codesToHydrate = items
      .filter((item) => !item.subject || !item.examDate || !item.difficulty || !item.grade || item.label === item.code)
      .map((item) => item.code);
    if (codesToHydrate.length === 0) return;

    let isCancelled = false;

    const hydrate = async () => {
      const hydrated = await Promise.all(
        codesToHydrate.map(async (code) => {
          const { questionSet, relatedFlashcardCode } = await loadQuestionSetByCode(code);
          if (!questionSet) return null;
          return {
            code,
            relatedFlashcardCode,
            subject: questionSet.subject || null,
            examDate: formatExamDateLabel(questionSet.exam_date ?? null),
            difficulty: questionSet.difficulty ?? null,
            grade: questionSet.grade != null ? String(questionSet.grade) : null,
            label: questionSet.name || code,
          };
        })
      );

      if (isCancelled) return;

      const patchByCode = new Map(
        hydrated
          .filter((item): item is NonNullable<(typeof hydrated)[number]> => Boolean(item))
          .map((item) => [item.code, item])
      );
      if (patchByCode.size === 0) return;

      const newCodes = hydrated.reduce<Record<string, string | null>>((acc, item) => {
        if (!item) return acc;
        acc[item.code] = item.relatedFlashcardCode ?? null;
        return acc;
      }, {});

      setItems((current) =>
        current.map((item) => {
          const patch = patchByCode.get(item.code);
          if (!patch) return item;
          return {
            ...item,
            label: patch.label,
            subject: patch.subject,
            examDate: patch.examDate,
            difficulty: patch.difficulty,
            grade: patch.grade,
          };
        })
      );
      setRelatedFlashcardCodes((current) => ({ ...current, ...newCodes }));
    };

    void hydrate();

    return () => {
      isCancelled = true;
    };
  }, [items, loadQuestionSetByCode]);

  useEffect(() => {
    if (selectableItems.length === 0) {
      if (selectedCode) setSelectedCode('');
      return;
    }

    const hasSelected = selectableItems.some((item) => item.code === selectedCode);
    if (!hasSelected) {
      setSelectedCode(selectableItems[0]?.code ?? '');
    }
  }, [selectableItems, selectedCode]);

  const hasPracticedSets = selectableItems.length > 0;
  const hasSelectedSet = Boolean(selectedCode);
  const sectionHeadingId = 'achievements-mastery-heading';

  return (
    <section
      data-testid="achievements-map-section"
      aria-labelledby={sectionHeadingId}
      className="rounded-xl border border-slate-200/85 bg-white/90 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <header className="mb-4 flex items-center gap-2">
        <MapTrifold size={20} weight="duotone" className="text-slate-500 dark:text-slate-300" aria-hidden="true" />
        <h2 id={sectionHeadingId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">Aiheiden hallinta</h2>
      </header>

      {!hasPracticedSets ? (
        <Alert data-testid="achievements-map-empty">
          <AlertDescription>
            Harjoittele ensin ainakin yksi koe. Aiheiden hallinta avautuu automaattisesti, kun topic-osaamisdataa on kertynyt.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="achievements-map-set" className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Valitse koe
            </label>
            <select
              id="achievements-map-set"
              value={selectedCode}
              onChange={(event) => setSelectedCode(event.target.value)}
              className={`min-h-12 rounded-lg border border-slate-200 bg-white px-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:focus-visible:ring-offset-gray-900 ${colors.map.ring}`}
            >
              {selectableItems.map((item) => (
                <option key={item.code} value={item.code}>
                  {formatPracticedSetDropdownLabel(item)}
                </option>
              ))}
            </select>
          </div>

          {hasSelectedSet ? (
            <TopicMasteryDisplay
              questionSetCode={selectedCode}
              flashcardSetCode={relatedFlashcardCodes[selectedCode] ?? null}
              className="mt-2 border-t-0 pt-0"
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
