import type { Badge } from '@/types';
import { BadgeToken } from '@/components/badges/BadgeToken';
import { Card, CardContent } from '@/components/ui/card';

interface BadgePreviewCardProps {
  badges: Badge[];
}

export function BadgePreviewCard({ badges }: BadgePreviewCardProps) {
  if (badges.length === 0) {
    return null;
  }

  return (
    <Card
      variant="standard"
      padding="none"
      className="rounded-xl border-slate-200 shadow-none dark:border-slate-800"
      data-testid="results-badge-preview"
    >
      <CardContent className="p-5">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Uudet merkit</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Taman kierroksen aikana avautuneet merkit.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {badges.map((badge) => (
            <BadgeToken key={badge.id} badge={badge} highlighted className="mx-auto" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
