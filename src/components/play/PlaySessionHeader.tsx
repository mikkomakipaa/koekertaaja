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
  onAction?: () => void;
  actionAriaLabel?: string;
  progressCurrent?: number;
  progressTotal?: number;
  sticky?: boolean;
}

export function PlaySessionHeader({
  tone = 'quiz',
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  actionAriaLabel,
  progressCurrent,
  progressTotal,
  sticky = true,
}: PlaySessionHeaderProps) {
  const shellClassName =
    tone === 'flashcard'
      ? 'bg-gradient-to-r from-teal-600 to-teal-500 dark:from-teal-700 dark:to-teal-600 text-white'
      : 'bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-indigo-700 dark:to-indigo-600 text-white';

  return (
    <div className={sticky ? `${shellClassName} sticky top-0 z-10` : shellClassName}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? <span className="shrink-0 text-white/85">{icon}</span> : null}
              <h2 className="truncate text-base font-semibold md:text-lg">{title}</h2>
            </div>
            {subtitle ? (
              <p className="mt-1 text-sm text-white/85">
                {subtitle}
              </p>
            ) : null}
          </div>

          {actionLabel && onAction ? (
            <Button
              onClick={onAction}
              variant="ghost"
              size="sm"
              aria-label={actionAriaLabel ?? actionLabel}
              className="shrink-0 text-white/90 hover:bg-white/10 hover:text-white"
            >
              {actionLabel}
            </Button>
          ) : null}
        </div>

        {typeof progressCurrent === 'number' && typeof progressTotal === 'number' ? (
          <ProgressBar
            current={progressCurrent}
            total={progressTotal}
            mode={tone}
            variant="header"
          />
        ) : null}
      </div>
    </div>
  );
}
