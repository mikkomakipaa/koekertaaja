'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link.js';
import {
  Medal,
  ArrowLeft,
  Fire,
  Star,
  Sparkle,
} from '@phosphor-icons/react';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { ExamHistoryTab } from '@/components/achievements/ExamHistoryTab';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <Link
              href="/play"
              className="inline-grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
              aria-label="Takaisin"
            >
              <ArrowLeft size={20} weight="regular" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold leading-[1.1] tracking-tight text-slate-950 dark:text-slate-50 max-[480px]:text-[19px]">
                Saavutukset
              </h1>
            </div>
          </div>
        </section>
        <StatsSection stats={stats} unlockedCount={unlockedCount} />
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

function StatsSection({ stats, unlockedCount }: { stats: BadgeStats; unlockedCount: number }) {
  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          <Medal size={16} weight="duotone" className="text-slate-500 dark:text-slate-300" />
          Tilastot
        </p>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Harjoittelun yhteenveto</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Fire size={18} weight="duotone" className="text-orange-500" />
              Sessiota
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">{stats.totalSessions}</div>
          </CardContent>
        </Card>

        <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Star size={18} weight="fill" className="text-yellow-500" />
              Täydellistä
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">{stats.perfectScores}</div>
          </CardContent>
        </Card>

        <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Sparkle size={18} weight="duotone" className="text-emerald-500" />
              Ennätys
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">
              {stats.personalBest > 0 ? stats.personalBest.toLocaleString('fi-FI') : '—'}
            </div>
          </CardContent>
        </Card>

        <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Medal size={18} weight="duotone" className="text-blue-500" />
              Merkkejä
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">
              {unlockedCount}/{BADGE_TOTAL}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
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
            <Link
              href="/play"
              className="inline-grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-black/[0.08] bg-black/[0.02] text-gray-600 transition-all hover:bg-black/[0.04] hover:text-gray-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-400 dark:focus-visible:ring-offset-gray-900"
              aria-label="Takaisin"
            >
              <ArrowLeft size={20} weight="regular" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold leading-[1.1] tracking-tight text-slate-950 dark:text-slate-50 max-[480px]:text-[19px]">
                Saavutukset
              </h1>
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
