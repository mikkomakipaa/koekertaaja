import type { Badge, BadgeId } from '@/types';
import { Medal } from '@phosphor-icons/react';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { BadgeToken } from '@/components/badges/BadgeToken';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeCollectionCardProps {
  badges: Badge[];
  description: string;
  highlightedBadgeIds?: BadgeId[];
  className?: string;
  contentClassName?: string;
  testId?: string;
}

export function BadgeCollectionCard({
  badges,
  description,
  highlightedBadgeIds = [],
  className,
  contentClassName,
  testId,
}: BadgeCollectionCardProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <Card
      variant="standard"
      padding="none"
      className={cn('rounded-xl border-slate-200 shadow-none dark:border-slate-800', className)}
      data-testid={testId}
    >
      <CardHeader className="space-y-1 border-b border-slate-200 p-5 dark:border-slate-800">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          Merkkikokoelma
        </p>
        <CardTitle className="flex items-center gap-2 text-xl text-gray-900 dark:text-gray-100">
          <Medal weight="duotone" className="h-5 w-5" />
          Kaikki merkit ({unlockedCount}/{badges.length})
        </CardTitle>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </CardHeader>
      <CardContent className={cn('p-5', contentClassName)}>
        <div className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-4 sm:gap-x-3 sm:gap-y-5 md:grid-cols-5 lg:grid-cols-6">
          {badges.map((badge) => (
            <BadgeDisplay badge={badge} key={badge.id} className="mx-auto">
              <BadgeToken badge={badge} highlighted={highlightedBadgeIds.includes(badge.id)} />
            </BadgeDisplay>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
