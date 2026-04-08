import type { Badge, BadgeId } from '@/types';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { BadgeToken } from '@/components/badges/BadgeToken';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeCollectionCardProps {
  badges: Badge[];
  description?: string;
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
  return (
    <Card
      variant="standard"
      padding="none"
      className={cn('rounded-xl border-slate-200 shadow-none dark:border-slate-800', className)}
      data-testid={testId}
    >
      <CardContent className={cn('p-5', contentClassName)}>
        {description ? (
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        ) : null}
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
