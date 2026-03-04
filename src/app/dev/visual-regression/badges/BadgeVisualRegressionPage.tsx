'use client';

import { useEffect, type ReactNode } from 'react';
import { Medal, Fire, Sparkle, ArrowCounterClockwise, Star, Trophy } from '@phosphor-icons/react';
import { AppShellHeader } from '@/components/layout/AppShellHeader';
import { BadgeCollectionCard } from '@/components/badges/BadgeCollectionCard';
import { Card, CardContent } from '@/components/ui/card';
import {
  BADGE_VISUAL_REGRESSION_BADGES,
  BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS,
  BADGE_VISUAL_REGRESSION_RESULTS,
  BADGE_VISUAL_REGRESSION_STATS,
} from '@/lib/fixtures/badgeVisualRegression';

interface BadgeVisualRegressionPageProps {
  theme: 'light' | 'dark';
}

export function BadgeVisualRegressionPage({ theme }: BadgeVisualRegressionPageProps) {
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');

    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, [theme]);

  const unlockedCount = BADGE_VISUAL_REGRESSION_BADGES.filter((badge) => badge.unlocked).length;

  return (
    <div className="min-h-screen bg-slate-100 p-4 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section data-testid="results-badge-visual" className="rounded-[28px] border border-slate-200/80 bg-gradient-to-b from-indigo-50 to-white p-4 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 md:p-6">
          <AppShellHeader
            icon={
              <div className="flex items-center justify-center rounded-xl bg-emerald-100 p-2.5 dark:bg-emerald-500/20">
                <Trophy size={48} weight="duotone" className="text-emerald-600 dark:text-emerald-300" />
              </div>
            }
            title="Sigma Suoritus."
            description={`Historia kevätkoe · ${BADGE_VISUAL_REGRESSION_RESULTS.score} / ${BADGE_VISUAL_REGRESSION_RESULTS.total} oikein (93%)`}
            tone="success"
            className="mb-4"
          />

          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard icon={<Fire size={18} weight="duotone" className="text-orange-500" />} label="Paras putki" value={String(BADGE_VISUAL_REGRESSION_RESULTS.bestStreak)} />
            <MetricCard icon={<ArrowCounterClockwise size={18} weight="duotone" className="text-amber-500" />} label="Ohitetut" value={String(BADGE_VISUAL_REGRESSION_RESULTS.skippedAnswers)} />
            <MetricCard icon={<Medal size={18} weight="duotone" className="text-purple-500" />} label="Uusia merkkejä" value={String(BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS.length)} />
            <MetricCard icon={<Sparkle size={18} weight="duotone" className="text-emerald-500" />} label="Henkilökohtainen ennätys" value={String(BADGE_VISUAL_REGRESSION_STATS.personalBest)} />
          </div>

          <div className="mb-5 grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-none dark:border-slate-800 dark:bg-slate-900">
            <div className="rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">Yhteenveto</div>
            <div className="rounded-xl px-3 py-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">Vastaukset</div>
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-center text-sm font-semibold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
              Merkit ({unlockedCount}/{BADGE_VISUAL_REGRESSION_BADGES.length})
            </div>
          </div>

          <BadgeCollectionCard
            badges={BADGE_VISUAL_REGRESSION_BADGES}
            highlightedBadgeIds={BADGE_VISUAL_REGRESSION_HIGHLIGHTED_IDS}
            description="Deterministinen Results-fixture lukituille, avatuile ja korostetuille merkeille."
            testId="results-badge-collection"
          />
        </section>

        <section data-testid="achievements-badge-visual" className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:p-6">
          <AppShellHeader
            icon={<Trophy size={24} weight="duotone" />}
            title="Saavutukset"
            description={`Avaat merkkejä harjoittelemalla. Olet avannut ${unlockedCount}/${BADGE_VISUAL_REGRESSION_BADGES.length} merkkiä.`}
            className="mb-4"
          />

          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetricCard icon={<Fire size={18} weight="duotone" className="text-orange-500" />} label="Sessiota" value={String(BADGE_VISUAL_REGRESSION_STATS.totalSessions)} />
            <MetricCard icon={<Star size={18} weight="fill" className="text-yellow-500" />} label="Täydellistä" value={String(BADGE_VISUAL_REGRESSION_STATS.perfectScores)} />
            <MetricCard icon={<Sparkle size={18} weight="duotone" className="text-emerald-500" />} label="Ennätys" value={String(BADGE_VISUAL_REGRESSION_STATS.personalBest)} />
            <MetricCard icon={<Medal size={18} weight="duotone" className="text-blue-500" />} label="Merkkejä" value={`${unlockedCount}/${BADGE_VISUAL_REGRESSION_BADGES.length}`} />
          </div>

          <BadgeCollectionCard
            badges={BADGE_VISUAL_REGRESSION_BADGES}
            description="Deterministinen Achievements-fixture samoilla badge-stateilla ilman localStorage-riippuvuutta."
            testId="achievements-badge-collection"
          />
        </section>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card variant="standard" padding="compact" className="rounded-xl border-slate-200 shadow-none dark:border-slate-800">
      <CardContent>
        <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 md:text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}
