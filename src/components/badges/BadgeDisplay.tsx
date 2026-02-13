'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { X } from '@phosphor-icons/react';
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
  const [isMobile, setIsMobile] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const unlockedLabel = badge.unlockedAt
    ? `Avattu ${dateFormatter.format(badge.unlockedAt)}`
    : 'Avattu aiemmin';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateIsMobile = (event?: MediaQueryListEvent) => {
      setIsMobile(event ? event.matches : mediaQuery.matches);
    };

    updateIsMobile();
    mediaQuery.addEventListener('change', updateIsMobile);

    return () => {
      mediaQuery.removeEventListener('change', updateIsMobile);
    };
  }, []);

  const handleTriggerClick = () => {
    if (!isMobile) return;
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    setDetailsOpen(false);
  };

  return (
    <>
      <Tooltip.Provider>
        <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className={cn('text-left focus-visible:outline-none', className)}
            aria-label={badge.name}
            onClick={handleTriggerClick}
          >
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={5}
            className="z-50 hidden max-w-xs rounded-lg bg-gray-900 px-4 py-3 text-white shadow-xl md:block dark:bg-gray-800"
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

      {detailsOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            onClick={closeDetails}
            className="absolute inset-0 bg-black/50"
            aria-label="Sulje merkin tiedot"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${badge.name} - merkin tiedot`}
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-gray-900"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold text-gray-900 dark:text-gray-100">{badge.name}</div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Sulje"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {badge.unlocked ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{unlockedLabel}</p>
            ) : (
              <div>
                <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">Avaa kun:</div>
                <ul className="mt-2 space-y-2 text-sm text-gray-700 dark:text-gray-200">
                  {badge.unlockConditions.map((condition, index) => (
                    <li key={`${badge.id}-mobile-condition-${index}`} className="flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                      <span>{condition}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
