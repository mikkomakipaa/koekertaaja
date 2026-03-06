'use client';

import { ArrowRight, Brain } from '@phosphor-icons/react';
import Link from 'next/link';
import { useMemo } from 'react';
import { useTopicMastery } from '@/hooks/useTopicMastery';
import { normalizeTopicLabel } from '@/lib/topics/normalization';

interface TopicMasteryDisplayProps {
  questionSetCode: string;
  flashcardSetCode?: string | null;
  className?: string;
}

export function TopicMasteryDisplay({ questionSetCode, flashcardSetCode, className = '' }: TopicMasteryDisplayProps) {
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  const masteryStats = useMemo(() => {
    if (!hasMasteryData()) {
      return null;
    }
    const stats = getMasteryStats();
    const mergedByCanonical = Object.entries(stats).reduce<Record<string, { correct: number; total: number; percentage: number }>>(
      (acc, [topic, value]) => {
        const canonicalTopic = normalizeTopicLabel(topic);
        if (!canonicalTopic) return acc;

        const current = acc[canonicalTopic] ?? { correct: 0, total: 0, percentage: 0 };
        const total = current.total + value.total;
        const correct = current.correct + value.correct;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

        acc[canonicalTopic] = {
          correct,
          total,
          percentage,
        };
        return acc;
      },
      {}
    );
    const sorted = Object.entries(mergedByCanonical).sort((a, b) => b[1].percentage - a[1].percentage);
    return sorted;
  }, [getMasteryStats, hasMasteryData]);

  if (!masteryStats || masteryStats.length === 0) {
    return (
      <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 ${className}`}>
        <p className="text-sm text-gray-500 dark:text-gray-400">Aiheita ei saatavilla.</p>
      </div>
    );
  }

  const getColor = (percentage: number) => {
    if (percentage >= 90) {
      return {
        bg: 'bg-emerald-500',
        text: 'text-emerald-700 dark:text-emerald-300',
      };
    }
    if (percentage >= 70) {
      return {
        bg: 'bg-teal-500',
        text: 'text-teal-700 dark:text-teal-300',
      };
    }
    if (percentage >= 50) {
      return {
        bg: 'bg-amber-500',
        text: 'text-amber-700 dark:text-amber-300',
      };
    }
    return {
      bg: 'bg-slate-400',
      text: 'text-slate-600 dark:text-slate-400',
    };
  };

  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        <Brain size={14} weight="duotone" />
        <span>Hallintasi</span>
      </div>

      <div className="space-y-4">
        {masteryStats.map(([topic, stats]) => {
          const colors = getColor(stats.percentage);
          const canReviewTopic = Boolean(flashcardSetCode) && stats.percentage < 80;
          const reviewHref = `/play/${flashcardSetCode}?mode=opettele&topic=${encodeURIComponent(topic)}`;

          const rowContent = (
            <div className="rounded-lg px-1 py-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700 dark:text-gray-300">{topic}</span>
                <span className={`text-xs font-semibold ${colors.text}`}>{stats.percentage}%</span>
              </div>

              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
                  style={{ width: `${stats.percentage}%` }}
                  role="progressbar"
                  aria-valuenow={stats.percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${topic}: ${stats.percentage}% hallinnassa`}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
                <span>{stats.correct}/{stats.total} oikein</span>
                {canReviewTopic ? (
                  <span className="inline-flex min-h-[32px] items-center gap-1 px-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    Kertaa
                    <ArrowRight size={12} weight="bold" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
            </div>
          );

          if (canReviewTopic) {
            return (
              <Link
                key={topic}
                href={reviewHref}
                className="block cursor-pointer rounded-lg transition-colors hover:bg-teal-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:hover:bg-teal-900/20"
              >
                {rowContent}
              </Link>
            );
          }

          return <div key={topic}>{rowContent}</div>;
        })}
      </div>

    </div>
  );
}
