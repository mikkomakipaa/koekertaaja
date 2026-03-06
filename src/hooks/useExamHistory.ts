import { useEffect, useRef, useState } from 'react';
import {
  listPracticedSetDropdownItemsFromStorage,
  writePracticedSetMetadataToStorage,
} from '@/lib/mindMap/storage';
import { readLastScoreFromStorage } from '@/hooks/useLastScore';
import type { ExamHistoryEntry } from '@/types/examHistory';
import { stripDifficultySuffix } from '@/lib/question-set-name';

const stripDifficultySuffixOrNull = (name: string | null): string | null => {
  if (!name) return null;

  const trimmedName = name.trim();
  if (trimmedName.length === 0) return null;

  const baseName = stripDifficultySuffix(trimmedName).trim();
  return baseName.length > 0 ? baseName : null;
};

const toExamHistoryEntry = (
  item: ReturnType<typeof listPracticedSetDropdownItemsFromStorage>[number]
): ExamHistoryEntry => {
  const lastScore = readLastScoreFromStorage(item.code);
  const sortTimestamp = Math.max(lastScore?.timestamp ?? 0, item.practicedAt ?? 0);

  return {
    code: item.code,
    name: stripDifficultySuffixOrNull(item.label),
    subject: item.subject ?? null,
    examDate: item.examDate ?? null,
    difficulty: item.difficulty ?? null,
    grade: item.grade ?? null,
    sortTimestamp,
    lastScore,
  };
};

const isDisplayableExamEntry = (entry: ExamHistoryEntry): boolean => {
  if (!entry.lastScore) return false;

  const hasMetadata = Boolean(
    entry.subject?.trim()
    || entry.examDate?.trim()
    || entry.difficulty?.trim()
    || entry.grade?.trim()
  );
  const normalizedName = entry.name?.trim() ?? '';
  const nameLooksLikeCode =
    normalizedName.length === 0
      || normalizedName.toUpperCase() === entry.code.trim().toUpperCase();

  return hasMetadata || !nameLooksLikeCode;
};

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

export function useExamHistory(): { entries: ExamHistoryEntry[]; isEmpty: boolean } {
  const [entries, setEntries] = useState<ExamHistoryEntry[]>([]);
  const hydratedCodesRef = useRef<Set<string>>(new Set());
  const pendingCodesRef = useRef<Set<string>>(new Set());
  const createdSetsCacheRef = useRef<Map<string, {
    name: string | null;
    subject: string | null;
    examDate: string | null;
    difficulty: string | null;
    grade: string | null;
  }> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const practicedSets = listPracticedSetDropdownItemsFromStorage();
    const nextEntries = practicedSets
      .map(toExamHistoryEntry)
      .filter(isDisplayableExamEntry)
      .sort((a, b) => b.sortTimestamp - a.sortTimestamp);

    setEntries(nextEntries);
  }, []);

  useEffect(() => {
    if (entries.length === 0) return;

    const missingCodes = entries
      .filter((entry) => {
        const subjectMissing = !entry.subject;
        const examDateMissing = !entry.examDate;
        const nameLooksLikeCode = !entry.name || entry.name.trim().toUpperCase() === entry.code.toUpperCase();
        return (subjectMissing || examDateMissing || nameLooksLikeCode)
          && !hydratedCodesRef.current.has(entry.code);
      })
      .map((entry) => entry.code)
      .filter((code) => !pendingCodesRef.current.has(code));

    if (missingCodes.length === 0) return;

    missingCodes.forEach((code) => pendingCodesRef.current.add(code));

    let cancelled = false;

    const hydrateMissingMetadata = async () => {
      const getCreatedSetLookup = async () => {
        if (createdSetsCacheRef.current) return createdSetsCacheRef.current;

        try {
          const response = await fetch('/api/question-sets?scope=created', {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          });
          if (!response.ok) return null;

          const payload = (await response.json()) as {
            data?: Array<{
              code?: string;
              name?: string | null;
              subject?: string | null;
              exam_date?: string | null;
              difficulty?: string | null;
              grade?: number | string | null;
            }>;
          };

          const lookup = new Map<string, {
            name: string | null;
            subject: string | null;
            examDate: string | null;
            difficulty: string | null;
            grade: string | null;
          }>();

          for (const set of payload.data ?? []) {
            if (!set.code) continue;
            lookup.set(set.code, {
              name: stripDifficultySuffixOrNull(set.name ?? null),
              subject: set.subject ?? null,
              examDate: formatExamDateLabel(set.exam_date ?? null),
              difficulty: set.difficulty ?? null,
              grade: set.grade == null ? null : String(set.grade),
            });
          }

          createdSetsCacheRef.current = lookup;
          return lookup;
        } catch {
          return null;
        }
      };

      const hydrated = await Promise.all(
        missingCodes.map(async (code) => {
          try {
            const response = await fetch(`/api/question-sets?code=${encodeURIComponent(code)}`, {
              method: 'GET',
              headers: { Accept: 'application/json' },
              cache: 'no-store',
            });
            if (!response.ok) return null;

            const payload = (await response.json()) as {
              data?: {
                name?: string | null;
                subject?: string | null;
                exam_date?: string | null;
                difficulty?: string | null;
                grade?: number | string | null;
              };
            };

            if (payload.data) {
              return {
                code,
                name: stripDifficultySuffixOrNull(payload.data.name ?? null),
                subject: payload.data.subject ?? null,
                examDate: formatExamDateLabel(payload.data.exam_date ?? null),
                difficulty: payload.data.difficulty ?? null,
                grade:
                  payload.data.grade == null
                    ? null
                    : String(payload.data.grade),
              };
            }

            const createdLookup = await getCreatedSetLookup();
            const fallback = createdLookup?.get(code) ?? null;
            if (!fallback) return null;

            return {
              code,
              ...fallback,
            };
          } catch {
            const createdLookup = await getCreatedSetLookup();
            const fallback = createdLookup?.get(code) ?? null;
            if (!fallback) return null;

            return {
              code,
              ...fallback,
            };
          }
        })
      );

      if (cancelled) return;

      const patchByCode = new Map(
        hydrated
          .filter((item): item is NonNullable<(typeof hydrated)[number]> => Boolean(item))
          .map((item) => [item.code, item])
      );
      if (patchByCode.size === 0) {
        missingCodes.forEach((code) => pendingCodesRef.current.delete(code));
        return;
      }

      for (const [code, patch] of patchByCode.entries()) {
        hydratedCodesRef.current.add(code);
        pendingCodesRef.current.delete(code);
        writePracticedSetMetadataToStorage({
          code,
          name: patch.name,
          subject: patch.subject,
          examDate: patch.examDate,
          difficulty: patch.difficulty,
          grade: patch.grade,
          practicedAt: Date.now(),
        });
      }

      for (const code of missingCodes) {
        if (!patchByCode.has(code)) {
          pendingCodesRef.current.delete(code);
        }
      }

      setEntries((current) =>
        current.map((entry) => {
          const patch = patchByCode.get(entry.code);
          if (!patch) return entry;
          return {
            ...entry,
            name: patch.name ?? entry.name,
            subject: patch.subject ?? entry.subject,
            examDate: patch.examDate ?? entry.examDate,
            difficulty: patch.difficulty ?? entry.difficulty,
            grade: patch.grade ?? entry.grade,
          };
        }).filter(isDisplayableExamEntry)
      );
    };

    void hydrateMissingMetadata();

    return () => {
      cancelled = true;
      missingCodes.forEach((code) => pendingCodesRef.current.delete(code));
    };
  }, [entries]);

  return {
    entries,
    isEmpty: entries.length === 0,
  };
}
