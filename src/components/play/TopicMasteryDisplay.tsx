'use client';

import { ArrowRight, Brain } from '@phosphor-icons/react';
import Link from 'next/link.js';
import { useMemo } from 'react';
import { useTopicMastery } from '@/hooks/useTopicMastery';
import { buildTopicMasteryItems } from '@/lib/play/results-screen';

interface TopicMasteryDisplayProps {
  questionSetCode: string;
  flashcardSetCode?: string | null;
  className?: string;
  showHeader?: boolean;
  showProgressBar?: boolean;
}

export function TopicMasteryDisplay({
  questionSetCode,
  flashcardSetCode,
  className = '',
  showHeader = true,
  showProgressBar = true,
}: TopicMasteryDisplayProps) {
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  const masteryStats = useMemo(() => {
    if (!hasMasteryData()) {
      return null;
    }
    return buildTopicMasteryItems(getMasteryStats(), flashcardSetCode);
  }, [flashcardSetCode, getMasteryStats, hasMasteryData]);

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
      {showHeader ? (
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Brain size={16} weight="duotone" />
          <span>Hallintasi</span>
        </div>
      ) : null}

      <div className="space-y-4">
        {masteryStats.map((item) => {
          const colors = getColor(item.percentage);
          const canReviewTopic = Boolean(item.reviewHref);

          const rowContent = (
            <div className="rounded-lg px-1 py-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.topic}</span>
                <span className={`text-sm font-semibold ${colors.text}`}>{item.percentage}%</span>
              </div>

              {showProgressBar ? (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className={`h-full ${colors.bg} transition-all duration-500 ease-out`}
                    style={{ width: `${item.percentage}%` }}
                    role="progressbar"
                    aria-valuenow={item.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.topic}: ${item.percentage}% hallinnassa`}
                  />
                </div>
              ) : null}

              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{item.correct}/{item.total} oikein</span>
                {canReviewTopic ? (
                  <span className="inline-flex min-h-[32px] items-center gap-1 px-1 text-xs font-semibold text-teal-700 dark:text-teal-300">
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
                key={item.topic}
                href={item.reviewHref ?? '#'}
                className="block cursor-pointer rounded-lg transition-colors hover:bg-teal-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:hover:bg-teal-900/20"
              >
                {rowContent}
              </Link>
            );
          }

          return <div key={item.topic}>{rowContent}</div>;
        })}
      </div>

    </div>
  );
}
