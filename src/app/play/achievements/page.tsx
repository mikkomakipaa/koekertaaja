'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link.js';
import {
  Trophy,
  Medal,
  ArrowLeft,
  Fire,
  Star,
  Sparkle,
} from '@phosphor-icons/react';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AchievementsMapSection } from '@/components/mindMap/AchievementsMapSection';
import { AppShellHeader } from '@/components/layout/AppShellHeader';
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
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
        <AppShellHeader
          icon={<Trophy size={24} weight="duotone" />}
          title="Saavutukset"
          description={`Avaat merkkejä harjoittelemalla. Olet avannut ${unlockedCount}/${BADGE_TOTAL} merkkiä.`}
          leadingAction={
            <Link
              href="/play"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-gray-900"
              aria-label="Takaisin pelaamaan"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
          }
        />
        <StatsSection stats={stats} unlockedCount={unlockedCount} />
        <BadgesSection badges={badges} />
        <AchievementsMapSection {...mapSectionProps} />
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
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Merkit, ennätykset ja pelatut sessiot samassa näkymässä.
        </p>
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
      description="Jokainen merkki avautuu harjoittelemalla. Napauta merkkiä nähdäksesi ehdot."
    />
  );
}

function EmptyAchievementsState() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 dark:bg-slate-950">
      <div className="mx-auto max-w-4xl space-y-3">
        <AppShellHeader
          icon={<Trophy size={24} weight="duotone" />}
          title="Saavutukset"
          description="Suorita ensimmäinen harjoituskierros avataksesi ensimmäisen merkin ja nähdäksesi tilastosi."
          leadingAction={
            <Link
              href="/play"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-gray-300 dark:hover:bg-gray-800 dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-gray-900"
              aria-label="Takaisin pelaamaan"
            >
              <ArrowLeft size={18} weight="bold" />
            </Link>
          }
        />

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
