'use client';

import Link from 'next/link';
import {
  Trophy,
  Medal,
  ArrowLeft,
  Fire,
  Star,
  Sparkle,
  LockSimple,
  GameController,
} from '@phosphor-icons/react';
import { BadgeDisplay } from '@/components/badges/BadgeDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBadgeColors, getBadgeIcon } from '@/lib/utils/badgeStyles';
import { cn } from '@/lib/utils';
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

  const unlockedCount = badges.filter((badge) => badge.unlocked).length;
  const hasProgress = stats.totalSessions > 0;

  if (!hasProgress) {
    return <EmptyAchievementsState />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white transition-colors dark:from-gray-900 dark:to-gray-800">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link
            href="/play"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            aria-label="Takaisin harjoitteluun"
          >
            <ArrowLeft size={18} weight="bold" />
            <span className="hidden sm:inline">Takaisin</span>
          </Link>

          <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100">
            <Trophy size={24} weight="duotone" className="text-amber-600 dark:text-amber-400" />
            Saavutukset
          </h1>

          <div className="w-24" />
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 p-6 pb-24">
        <StatsSection stats={stats} unlockedCount={unlockedCount} />
        <BadgesSection badges={badges} unlockedCount={unlockedCount} />

        <div className="pt-6 text-center">
          <Button
            asChild
            mode="neutral"
            size="lg"
            className="text-white shadow-md transition-all hover:shadow-lg active:shadow-sm"
          >
            <Link href="/play">
              <GameController size={20} weight="fill" />
              Takaisin harjoitteluun
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatsSection({ stats, unlockedCount }: { stats: BadgeStats; unlockedCount: number }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
        <Medal size={18} weight="duotone" className="text-purple-500" />
        TILASTOT
      </h2>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card variant="frosted" padding="compact">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Fire size={18} weight="duotone" className="text-orange-500" />
              Sessiota
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">{stats.totalSessions}</div>
          </CardContent>
        </Card>

        <Card variant="frosted" padding="compact">
          <CardContent>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Star size={18} weight="fill" className="text-yellow-500" />
              Täydellistä
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">{stats.perfectScores}</div>
          </CardContent>
        </Card>

        <Card variant="frosted" padding="compact">
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

        <Card variant="frosted" padding="compact">
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

function BadgesSection({ badges, unlockedCount }: { badges: Badge[]; unlockedCount: number }) {
  return (
    <Card variant="frosted" padding="standard">
      <CardHeader className="mb-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <Medal weight="duotone" className="h-5 w-5" />
          Kaikki merkit ({unlockedCount}/{badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {badges.map((badge) => {
            const colors = getBadgeColors(badge.id);
            return (
              <BadgeDisplay
                badge={badge}
                key={badge.id}
                className={cn(
                  'rounded-lg p-3 text-center transition-all',
                  badge.unlocked
                    ? `bg-gradient-to-br ${colors.light} ${colors.dark} border-2`
                    : 'bg-gray-100 opacity-50 dark:bg-gray-800'
                )}
              >
                <div className="mb-1 flex justify-center text-3xl">
                  {badge.unlocked ? getBadgeIcon(badge.id) : <LockSimple size={32} weight="fill" className="text-gray-400" />}
                </div>
                <div
                  className={cn(
                    'text-xs font-semibold',
                    badge.unlocked ? colors.text : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {badge.name}
                </div>
              </BadgeDisplay>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyAchievementsState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-6 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-amber-100 p-6 dark:bg-amber-900/30">
            <Trophy size={64} weight="duotone" className="text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">Aloita harjoittelu</h1>

        <p className="mb-8 text-base text-gray-600 dark:text-gray-400">
          Suorita ensimmäinen harjoituskierros avataksesi ensimmäisen merkin ja nähdäksesi tilastosi!
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            mode="neutral"
            size="lg"
            className="w-full text-white shadow-md hover:shadow-lg sm:w-auto"
          >
            <Link href="/play">
              <GameController size={20} weight="fill" />
              Aloita harjoittelu
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/">Takaisin valikkoon</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
