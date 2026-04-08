'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/play/ProgressBar';

interface PlaySessionHeaderProps {
  tone?: 'quiz' | 'flashcard';
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  actionAriaLabel?: string;
  progressCurrent?: number;
  progressTotal?: number;
  progressLabel?: string;
  sticky?: boolean;
}

export function PlaySessionHeader({
  tone = 'quiz',
  title,
  subtitle,
  icon,
  actionLabel,
  actionIcon,
  onAction,
  actionAriaLabel,
  progressCurrent,
  progressTotal,
  progressLabel,
  sticky = true,
}: PlaySessionHeaderProps) {
  const shellClassName =
    tone === 'flashcard'
      ? 'bg-teal-600 text-white md:bg-gradient-to-r md:from-teal-600 md:to-teal-500 dark:bg-teal-700 dark:md:from-teal-700 dark:md:to-teal-600'
      : 'bg-indigo-600 text-white md:bg-gradient-to-r md:from-indigo-600 md:to-indigo-500 dark:bg-indigo-700 dark:md:from-indigo-700 dark:md:to-indigo-600';
  const hasProgress = typeof progressCurrent === 'number' && typeof progressTotal === 'number';

  return (
    <div className={sticky ? `${shellClassName} sticky top-0 z-10` : shellClassName}>
      <div className="mx-auto max-w-4xl px-4 py-1.5 md:py-4">
        <div className="grid h-12 grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-2 md:flex md:h-auto md:min-h-0 md:justify-between md:gap-3">
          {actionLabel && onAction ? (
            <Button
              onClick={onAction}
              variant="ghost"
              size="sm"
              aria-label={actionAriaLabel ?? actionLabel}
              className="col-start-1 min-h-9 min-w-9 shrink-0 px-0 text-white/90 hover:bg-white/10 hover:text-white md:min-h-10 md:w-auto md:px-3"
            >
              {actionIcon ? <span className="inline-flex md:hidden">{actionIcon}</span> : null}
              <span className={actionIcon ? 'hidden md:inline' : 'inline'}>{actionLabel}</span>
            </Button>
          ) : (
            <div className="col-start-1 md:hidden" />
          )}

          <div className="col-start-2 min-w-0 md:flex-1">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              {icon ? <span className="inline-flex shrink-0 text-white/85">{icon}</span> : null}
              <h2 className="truncate text-[15px] font-semibold md:text-lg">{title}</h2>
            </div>
            {subtitle && !hasProgress ? (
              <p className="mt-1 text-center text-sm text-white/85 md:text-left md:text-sm">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="col-start-3 md:hidden" />
        </div>

        {hasProgress ? (
          <div className="mt-1 pb-0.5 md:mt-3 md:pb-0">
            <ProgressBar
              current={progressCurrent}
              total={progressTotal}
              mode={tone}
              variant="header"
              label={progressLabel ?? `Kysymys ${progressCurrent} / ${progressTotal}`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
