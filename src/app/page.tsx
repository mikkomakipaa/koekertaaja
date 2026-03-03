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
    <div className="flex min-h-screen flex-col bg-white transition-colors duration-300 ease-out dark:bg-gray-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
      >
        Siirry sisältöön
      </a>

      <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <header className="hero-fade">
            <section
              aria-labelledby="dashboard-heading"
              className="rounded-[24px] border border-black/10 bg-[linear-gradient(180deg,rgba(98,94,255,0.10),rgba(98,94,255,0.05))] px-4 py-3 text-slate-950 shadow-none dark:rounded-[28px] dark:border-slate-900/90 dark:bg-[linear-gradient(155deg,#3a38d2_0%,#2c2a9f_52%,#17194f_100%)] dark:text-white dark:shadow-sm dark:shadow-black/20 md:px-5 md:py-3"
            >
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
                  <h1 id="dashboard-heading" className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                    Koekertaaja
                  </h1>
                  <p className="mt-2 max-w-xl text-base font-medium text-[rgba(0,0,0,0.72)] dark:text-white/90 md:text-[17px]">
                    Valitse tapa harjoitella ja jatka siitä, mihin viimeksi jäit.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <PrimaryActionButton
                  onClick={() => router.push(dashboardAction.href)}
                  mode={dashboardAction.mode}
                  icon={
                    dashboardAction.mode === 'study' ? (
                      <Book size={20} weight="duotone" />
                    ) : (
                      <BookOpenText size={20} weight="duotone" />
                    )
                  }
                  label={dashboardAction.label}
                  ariaLabel={dashboardAction.label}
                  className="h-[52px] w-full rounded-2xl px-4 text-base"
                />
              </div>
            </section>
          </header>

          <section
            className="mt-3 border-t border-gray-100/70 pt-4 transition-colors dark:border-slate-800/70 md:mt-4 md:pt-5"
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

            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
              <Link
                href="/play?mode=pelaa"
                className="group scroll-fade rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-indigo-300 dark:focus-visible:ring-offset-slate-950"
                data-scroll
                style={{ '--stagger': '60ms' } as CSSProperties}
              >
                <Card className="h-full rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_10px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)] dark:group-hover:shadow-[0_4px_10px_rgba(0,0,0,0.24)]">
                  <CardHeader className="space-y-4">
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
                  <CardContent className="flex items-center justify-between border-t border-slate-200/90 pt-4 dark:border-slate-700/80">
                    <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Pelaa</span>
                    <ArrowRight size={18} weight="bold" className="text-indigo-600 transition-transform group-hover:translate-x-0.5 dark:text-indigo-300" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>

              <Link
                href="/play?mode=opettele"
                className="group scroll-fade rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-300 dark:focus-visible:ring-offset-slate-950"
                data-scroll
                style={{ '--stagger': '140ms' } as CSSProperties}
              >
                <Card className="h-full rounded-2xl border border-slate-200/90 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_4px_10px_rgba(15,23,42,0.06)] dark:border-slate-700/80 dark:bg-slate-900/70 dark:shadow-[0_1px_2px_rgba(0,0,0,0.18)] dark:group-hover:shadow-[0_4px_10px_rgba(0,0,0,0.24)]">
                  <CardHeader className="space-y-4">
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
                  <CardContent className="flex items-center justify-between border-t border-slate-200/90 pt-4 dark:border-slate-700/80">
                    <span className="text-sm font-medium text-teal-700 dark:text-teal-300">Opettele</span>
                    <ArrowRight size={18} weight="bold" className="text-teal-500 transition-transform group-hover:translate-x-0.5 dark:text-teal-300" aria-hidden="true" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          <div className="scroll-fade mt-6 border-t border-gray-100/70 pt-4 transition-colors dark:border-slate-800/70 md:mt-8 md:pt-6" data-scroll>
            <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
