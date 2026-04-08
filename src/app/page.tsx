'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Book, BookOpenText, Cards, GameController, ArrowRight } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/shared/Footer';
import { AudienceTabs } from '@/components/landing/AudienceTabs';
import { PrimaryActionButton } from '@/components/play/PrimaryActionButton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { readLastScoreFromStorage } from '@/hooks/useLastScore';
import { readSessionProgressFromStorage } from '@/hooks/useSessionProgress';
import { resolveDashboardPrimaryAction, type DashboardPrimaryAction } from '@/lib/play/primary-action';
import { getRecentQuestionSets } from '@/lib/supabase/queries';
import type { QuestionSet } from '@/types';

const defaultDashboardAction: DashboardPrimaryAction = {
  href: '/play?mode=pelaa',
  label: 'Aloita harjoittelu',
  description: '',
  mode: 'quiz',
};

const hasPublicSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function HomePage() {
  const router = useRouter();
  const [activeAudience, setActiveAudience] = useState<'oppilaille' | 'huoltajille'>('oppilaille');
  const [dashboardAction, setDashboardAction] = useState<DashboardPrimaryAction>(defaultDashboardAction);
  useScrollAnimation();

  useEffect(() => {
    let active = true;

    const loadDashboardAction = async () => {
      let recentQuestionSets: QuestionSet[] = [];

      if (hasPublicSupabaseEnv) {
        try {
          recentQuestionSets = await getRecentQuestionSets(12);
        } catch (error) {
          console.warn('Dashboard action fallback activated because recent question sets could not be loaded.', error);
        }
      }

      if (!active) return;

      setDashboardAction(
        resolveDashboardPrimaryAction({
          questionSets: recentQuestionSets,
          getLastScore: readLastScoreFromStorage,
          getSessionProgress: readSessionProgressFromStorage,
        })
      );
    };

    void loadDashboardAction();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-300 ease-out dark:bg-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
      >
        Siirry sisältöön
      </a>

      <main id="main-content" tabIndex={-1} className="flex-1">
        <header className="hero-fade">
          <section
            aria-labelledby="dashboard-heading"
            className="bg-[linear-gradient(180deg,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.10)_45%,rgba(99,102,241,0)_100%)] pt-[env(safe-area-inset-top)] text-slate-950 dark:bg-[linear-gradient(180deg,rgba(99,102,241,0.85)_0%,rgba(99,102,241,0.55)_40%,rgba(99,102,241,0)_100%)] dark:text-white"
          >
            <div className="mx-auto max-w-4xl px-4 pt-4 pb-5 md:px-8 md:pt-5 md:pb-6 dark:pt-5 dark:pb-8 md:dark:pt-6 md:dark:pb-10">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/80 ring-1 ring-indigo-200/80 backdrop-blur dark:bg-white/12 dark:ring-white/15">
                  <Image
                    src="/panda-scholar-graduation.png"
                    alt="Koekertaaja panda -logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <h1 id="dashboard-heading" className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                    Koekertaaja
                  </h1>
                  <p className="mt-2 max-w-xl text-base font-medium text-[rgba(0,0,0,0.78)] dark:text-white/90 md:text-[17px]">
                    Harjoittele kokeisiin ja opi uutta.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <PrimaryActionButton
                  onClick={() => router.push(dashboardAction.href)}
                  mode={dashboardAction.mode}
                  surface="hero"
                  icon={
                    dashboardAction.mode === 'study' ? (
                      <Book size={20} weight="duotone" />
                    ) : (
                      <BookOpenText size={20} weight="duotone" />
                    )
                  }
                  label={dashboardAction.label}
                  ariaLabel={dashboardAction.label}
                />
              </div>
            </div>
          </section>
        </header>

        <div className="mx-auto max-w-4xl px-4 pb-4 md:px-8 md:pb-6">
          <section
            className="mt-0 pt-3 transition-colors"
            aria-labelledby="modes-heading"
          >
            <div className="scroll-fade space-y-1" data-scroll>
              <h2 id="modes-heading" className="text-xl font-semibold text-gray-900 transition-colors dark:text-gray-100">
                Kaksi tapaa harjoitella
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Valitse sopiva tila ja siirry suoraan harjoituksiin.
              </p>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-4">
              <Link
                href="/play?mode=pelaa"
                className="group scroll-fade rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-slate-950"
                data-scroll
                style={{ '--stagger': '60ms' } as CSSProperties}
              >
                <Card className="h-full rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_3px_8px_rgba(15,23,42,0.05)] dark:border-gray-700 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.13)] dark:group-hover:shadow-[0_3px_8px_rgba(0,0,0,0.18)]">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 transition-colors dark:bg-indigo-500/15">
                        <GameController size={30} weight="duotone" className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
                          Tietovisat
                        </p>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                          Tee tehtäviä, kerää pisteitä ja jatka siitä, mihin viimeksi jäit.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Pelaa</span>
                    <ArrowRight size={18} weight="bold" className="text-indigo-600 transition-transform group-hover:translate-x-0.5 dark:text-indigo-300" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>

              <Link
                href="/play?mode=opettele"
                className="group scroll-fade rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-300 dark:focus-visible:ring-offset-slate-950"
                data-scroll
                style={{ '--stagger': '140ms' } as CSSProperties}
              >
                <Card className="h-full rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_3px_8px_rgba(15,23,42,0.05)] dark:border-gray-700 dark:bg-slate-900 dark:shadow-[0_1px_2px_rgba(0,0,0,0.13)] dark:group-hover:shadow-[0_3px_8px_rgba(0,0,0,0.18)]">
                  <CardHeader className="space-y-3 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 transition-colors dark:bg-teal-500/15">
                        <Cards size={30} weight="duotone" className="text-teal-500 dark:text-teal-300" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600 dark:text-teal-300">
                          Muistikortit
                        </p>
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Muistikortit</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                          Harjoittele rauhassa, kertaa aiheet ja etene omassa tahdissasi.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Opettele</span>
                    <ArrowRight size={18} weight="bold" className="text-teal-500 transition-transform group-hover:translate-x-0.5 dark:text-teal-300" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          <div className="scroll-fade mt-5 pt-4 transition-colors md:mt-6 md:pt-5" data-scroll>
            <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
