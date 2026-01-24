'use client';

import { Brain } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useTopicMastery } from '@/hooks/useTopicMastery';

interface TopicMasteryDisplayProps {
  questionSetCode: string;
  className?: string;
}

export function TopicMasteryDisplay({ questionSetCode, className = '' }: TopicMasteryDisplayProps) {
  const { getMasteryStats, hasMasteryData } = useTopicMastery(questionSetCode);

  const masteryStats = useMemo(() => {
    if (!hasMasteryData()) {
      return null;
    }
    const stats = getMasteryStats();
    const sorted = Object.entries(stats).sort((a, b) => b[1].percentage - a[1].percentage);
    return sorted;
  }, [getMasteryStats, hasMasteryData]);

  if (!masteryStats || masteryStats.length === 0) {
    return null;
  }

  const getColor = (percentage: number) => {
    if (percentage >= 80) {
      return {
        bg: 'bg-green-500',
        text: 'text-green-700 dark:text-green-300',
      };
    }
    if (percentage >= 50) {
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-700 dark:text-yellow-300',
      };
    }
    return {
      bg: 'bg-red-500',
      text: 'text-red-700 dark:text-red-300',
    };
  };

  return (
    <div className={`mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
        <Brain size={14} weight="duotone" />
        <span>Hallintasi</span>
      </div>

      {masteryStats.map(([topic, stats]) => {
        const colors = getColor(stats.percentage);

        return (
          <div key={topic} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-700 dark:text-gray-300">{topic}</span>
              <span className={`text-xs font-semibold ${colors.text}`}>{stats.percentage}%</span>
            </div>

            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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

            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              {stats.correct}/{stats.total} oikein
            </div>
          </div>
        );
      })}
    </div>
  );
}
