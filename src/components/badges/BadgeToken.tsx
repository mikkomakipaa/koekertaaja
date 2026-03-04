'use client';

import { LockSimple } from '@phosphor-icons/react';
import type { Badge } from '@/types';
import { cn } from '@/lib/utils';
import {
  getBadgeColors,
  getBadgeGlowClass,
  getBadgeIcon,
  isHighlightedBadge,
} from '@/lib/utils/badgeStyles';

interface BadgeTokenProps {
  badge: Badge;
  className?: string;
  highlighted?: boolean;
}

export function BadgeToken({ badge, className, highlighted }: BadgeTokenProps) {
  const colors = getBadgeColors(badge.id);
  const glowClass = getBadgeGlowClass(badge.id);
  const shouldHighlight = badge.unlocked && (highlighted ?? isHighlightedBadge(badge.id));
  const tokenLabel = `${badge.name} - ${badge.unlocked ? 'avattu' : 'lukittu'}`;

  return (
    <div className={cn('flex min-w-0 flex-col items-center gap-2.5 text-center', className)}>
      <div
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full border text-3xl transition-all sm:h-20 sm:w-20 lg:h-20 lg:w-20',
          badge.unlocked
            ? [
                'bg-gradient-to-br',
                colors.light,
                colors.dark,
                colors.text,
                glowClass,
              ]
            : [
                'border-slate-300 bg-slate-100 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]',
                'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
              ],
          shouldHighlight &&
            'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900',
          shouldHighlight && badge.id === '25_sessions' && 'ring-indigo-300 dark:ring-indigo-500/70',
          shouldHighlight && badge.id === 'perfect_score' && 'ring-amber-300 dark:ring-amber-500/70',
          shouldHighlight && badge.id === 'streak_10' && 'ring-orange-300 dark:ring-orange-500/70'
        )}
        aria-label={tokenLabel}
      >
        {badge.unlocked ? (
          <span aria-hidden="true">{getBadgeIcon(badge.id, 34)}</span>
        ) : (
          <>
            <span aria-hidden="true" className="opacity-85">
              {getBadgeIcon(badge.id, 34)}
            </span>
            <span className="absolute bottom-[2px] right-[2px] flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <LockSimple size={16} weight="fill" />
            </span>
          </>
        )}
      </div>

      <div
        className={cn(
          'min-h-[2rem] max-w-[6rem] text-[11px] font-semibold leading-snug sm:max-w-[6.5rem] sm:text-xs',
          badge.unlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'
        )}
      >
        {badge.name}
      </div>
    </div>
  );
}
