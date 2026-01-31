'use client';

import type { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Badge } from '@/types';
import { cn } from '@/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface BadgeDisplayProps {
  badge: Badge;
  className?: string;
  children: ReactNode;
}

export function BadgeDisplay({ badge, className, children }: BadgeDisplayProps) {
  const unlockedLabel = badge.unlockedAt
    ? `Avattu ${dateFormatter.format(badge.unlockedAt)}`
    : 'Avattu aiemmin';

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={cn('text-left focus-visible:outline-none', className)}
            aria-label={badge.name}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={5}
            className="z-50 max-w-xs rounded-lg bg-gray-900 px-4 py-3 text-white shadow-xl dark:bg-gray-800"
          >
            <div className="text-sm font-semibold">{badge.name}</div>
            <p className="mt-1 text-xs text-gray-300">{badge.description}</p>

            {badge.unlocked ? (
              <p className="mt-2 text-xs text-emerald-200">{unlockedLabel}</p>
            ) : (
              <div className="mt-2">
                <div className="text-xs font-semibold text-gray-200">Avaa kun:</div>
                <ul className="mt-1 space-y-1 text-xs text-gray-200">
                  {badge.unlockConditions.map((condition, index) => (
                    <li key={`${badge.id}-condition-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
