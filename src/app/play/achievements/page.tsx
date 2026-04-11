'use client';

import { AchievementsPageContent } from '@/app/play/achievements/AchievementsPageContent';
import { useBadges } from '@/hooks/useBadges';

export default function AchievementsPage() {
  const { badges, stats } = useBadges();
  const hasLoaded = badges.length > 0;

  if (!hasLoaded) {
    return null;
  }

  return <AchievementsPageContent badges={badges} stats={stats} />;
}
