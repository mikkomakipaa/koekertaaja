'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BookOpenText, Cards, GameController, ArrowRight } from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/shared/Footer';
import { AudienceTabs } from '@/components/landing/AudienceTabs';
import { PrimaryActionButton } from '@/components/play/PrimaryActionButton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useSelectedSchool } from '@/hooks/useSelectedSchool';

export default function HomePage() {
  const router = useRouter();
  const { schoolId, isLoaded } = useSelectedSchool();
  const [activeAudience, setActiveAudience] = useState<'oppilaille' | 'huoltajille'>('oppilaille');
  useScrollAnimation();

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-white transition-colors duration-300 ease-out dark:bg-gray-900">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[calc(env(safe-area-inset-top)+10rem)] bg-[linear-gradient(180deg,rgba(99,102,241,0.20)_0%,rgba(99,102,241,0.20)_58%,rgba(255,255,255,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(99,102,241,0.88)_0%,rgba(99,102,241,0.62)_60%,rgba(17,24,39,0)_100%)] md:bg-[linear-gradient(180deg,rgba(99,102,241,0.18)_0%,rgba(99,102,241,0.10)_55%,rgba(255,255,255,0)_100%)] md:dark:bg-[linear-gradient(180deg,rgba(99,102,241,0.85)_0%,rgba(99,102,241,0.55)_60%,rgba(17,24,39,0)_100%)]"
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
      >
        Siirry sisältöön
      </a>

      <main id="main-content" tabIndex={-1} className="relative z-10 flex-1">
        <header className="hero-fade bg-indigo-100/80 dark:bg-indigo-900/70 md:bg-transparent md:dark:bg-transparent">
          <section
            aria-labelledby="dashboard-heading"
            className="pt-[env(safe-area-inset-top)] text-slate-950 dark:text-white"
          >
            <div className="mx-auto max-w-4xl px-4 pt-4 pb-5 md:px-8 md:pt-5 md:pb-6 dark:pt-5 dark:pb-8 md:dark:pt-6 md:dark:pb-10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 translate-y-[-1px] items-center justify-center rounded-xl bg-white/80 p-1.5 ring-1 ring-indigo-200/80 backdrop-blur dark:bg-white/12 dark:ring-white/15">
                  <Image
                    src="/kk.svg"
                    alt="Koekertaaja logo"
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                </div>

                <div className="min-w-0 flex-1 max-w-[520px]">
                  <h1 id="dashboard-heading" className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                    Koekertaaja
                  </h1>
                  <p className="mt-1 text-base font-medium text-[rgba(0,0,0,0.78)] dark:text-white/90 md:text-[17px]">
                    Harjoittele kokeisiin ja opi uutta.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                <PrimaryActionButton
                  onClick={() => {
                    if (!isLoaded || !schoolId) {
                      router.push('/play/select-school');
                      return;
                    }

                    router.push('/play?mode=pelaa');
                  }}
                  mode="quiz"
                  surface="hero"
                  icon={<BookOpenText size={20} weight="duotone" />}
                  label="Aloita harjoittelu"
                  ariaLabel="Aloita harjoittelu"
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
