'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link.js';
import {
  ArrowLeft,
} from '@phosphor-icons/react';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { ExamHistoryTab } from '@/components/achievements/ExamHistoryTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconButton } from '@/components/ui/icon-button';
import { PageTitle } from '@/components/ui/page-title';
import { AchievementsMapSection } from '@/components/mindMap/AchievementsMapSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBadgeDefinitionCount, useBadges } from '@/hooks/useBadges';
import type { Badge } from '@/types';

interface BadgeStats {
  totalSessions: number;
  perfectScores: number;
  personalBest: number;
  levelsPlayed: string[];
}

const BADGE_TOTAL = getBadgeDefinitionCount();

export default function AchievementsPage() {
  const { badges, stats } = useBadges();
  const hasLoaded = badges.length > 0;

  if (!hasLoaded) {
    return null;
  }

  return <AchievementsPageContent badges={badges} stats={stats} />;
}

interface AchievementsPageContentProps {
  badges: Badge[];
  stats: BadgeStats;
  mapSectionProps?: ComponentProps<typeof AchievementsMapSection>;
}

export function AchievementsPageContent({
  badges,
  stats,
  mapSectionProps,
}: AchievementsPageContentProps) {
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const hasProgress = stats.totalSessions > 0;

  if (!hasProgress) {
    return <EmptyAchievementsState />;
  }

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
        <section className="border-b border-slate-200/80 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <IconButton asChild aria-label="Takaisin">
              <Link href="/play">
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </Link>
            </IconButton>
            <div className="min-w-0">
              <PageTitle>Saavutukset</PageTitle>
            </div>
          </div>
        </section>
        <Tabs defaultValue="exams" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-none dark:border-slate-800 dark:bg-slate-900">
            <TabsTrigger value="exams" className="rounded-xl text-sm md:text-base">
              Kokeet
            </TabsTrigger>
            <TabsTrigger value="mastery" className="rounded-xl text-sm md:text-base">
              Aiheet
            </TabsTrigger>
            <TabsTrigger value="badges" className="rounded-xl text-sm md:text-base">
              Merkit ({unlockedCount}/{BADGE_TOTAL})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="exams" className="mt-4">
            <ExamHistoryTab />
          </TabsContent>
          <TabsContent value="mastery" className="mt-4">
            <AchievementsMapSection {...mapSectionProps} />
          </TabsContent>
          <TabsContent value="badges" className="mt-4">
            <BadgesSection badges={badges} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BadgesSection({ badges }: { badges: Badge[] }) {
  return (
    <BadgeCollectionCard
      badges={badges}
    />
  );
}

function EmptyAchievementsState() {
  return (
    <div className="min-h-screen bg-white p-6 transition-colors dark:bg-gray-900">
      <div className="mx-auto max-w-4xl space-y-3">
        <section className="border-b border-slate-200/80 pb-4 dark:border-white/10">
          <div className="flex items-center gap-3">
            <IconButton asChild aria-label="Takaisin">
              <Link href="/play">
                <ArrowLeft size={20} weight="regular" aria-hidden="true" />
              </Link>
            </IconButton>
            <div className="min-w-0">
              <PageTitle>Saavutukset</PageTitle>
            </div>
          </div>
        </section>

        <Card variant="standard" padding="none" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="space-y-1 border-b border-slate-200 p-5 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Aloita tästä
            </p>
            <CardTitle className="text-xl">Ensimmäinen kierros avaa näkymän</CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Pelaa yksi harjoituskierros, niin tilastot ja ensimmäiset merkit ilmestyvät tänne.
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-slate-100"
            >
              Takaisin valikkoon
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
