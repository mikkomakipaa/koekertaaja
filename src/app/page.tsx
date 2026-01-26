'use client';

import { useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/shared/Footer';
import { AudienceTabs } from '@/components/landing/AudienceTabs';
import { BookOpenText, GameController, Cards, ArrowRight } from '@phosphor-icons/react';
import Image from 'next/image';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function HomePage() {
  const [activeAudience, setActiveAudience] = useState<'oppilaille' | 'huoltajille'>('oppilaille');
  useScrollAnimation();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col transition-colors duration-300 ease-out">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700"
      >
        Siirry sisältöön
      </a>
      <main id="main-content" tabIndex={-1} className="flex-1 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="text-center mb-5 md:mb-6 hero-fade">
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/90 shadow-sm ring-1 ring-slate-200/70 transition-colors dark:bg-slate-900/80 dark:ring-slate-600/60">
                <Image
                  src="/panda-scholar-graduation.png"
                  alt="Koekertaaja panda -logo"
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">Koekertaaja</h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-slate-300 mt-1 transition-colors">
              Harjoittele kokeisiin ja opi uutta
            </p>
          </header>

          {/* Start Button */}
          <div className="hero-fade hero-fade-delay">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 dark:from-emerald-600 dark:to-emerald-700 dark:hover:from-emerald-700 dark:hover:to-emerald-800 text-white py-8 rounded-xl font-bold text-2xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-600/30 transition-all flex items-center justify-center gap-3 motion-safe:transition-transform motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98] group"
            >
              <Link href="/play" className="flex items-center justify-center gap-3">
                <BookOpenText size={32} weight="duotone" aria-hidden="true" />
                Aloita harjoittelu
                <ArrowRight size={28} weight="bold" aria-hidden="true" className="transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Two Modes */}
          <section
            className="mt-6 md:mt-8 border-t border-gray-100/70 dark:border-slate-800/70 pt-4 md:pt-6 transition-colors"
            aria-labelledby="modes-heading"
          >
            <h2
              id="modes-heading"
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 scroll-fade transition-colors"
              data-scroll
            >
              Kaksi tapaa harjoitella
            </h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Link href="/play?mode=quiz" className="group scroll-fade" data-scroll style={{ '--stagger': '60ms' } as CSSProperties}>
                <Card className="h-full rounded-xl border border-indigo-100/70 dark:border-indigo-400/40 dark:bg-slate-900/70 shadow-sm group-hover:shadow-md dark:shadow-[0_0_0_1px_rgba(148,163,184,0.15)] dark:group-hover:shadow-[0_0_0_1px_rgba(148,163,184,0.28)] transition-all cursor-pointer">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 transition-colors">
                        <GameController size={32} weight="duotone" className="text-indigo-600 dark:text-indigo-300" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Tietovisat</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                          Testaa tietosi monivalintatehtävillä, täydennys- ja muilla kysymyksillä. Kerää pisteitä ja rakenna putkia!
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[400px] md:max-w-[560px]">
                        <picture>
                          <source srcSet="/screenshots/flashcard-mode.webp" type="image/webp" />
                          <Image
                            src="/screenshots/flashcard-mode.png"
                            alt="Esimerkki tietovisasta: monivalintakysymys, pisteet, putki ja edistyminen näkyvissä"
                            width={1200}
                            height={800}
                            loading="lazy"
                            sizes="(max-width: 768px) 90vw, 560px"
                            className="h-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-[0_0_0_1px_rgba(148,163,184,0.18)] ring-1 ring-slate-200/70 dark:ring-slate-600/50 object-contain transition-colors"
                          />
                        </picture>
                        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">Esimerkki tietovisasta</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/play?mode=flashcard" className="group scroll-fade" data-scroll style={{ '--stagger': '140ms' } as CSSProperties}>
                <Card className="h-full rounded-xl border border-teal-100/70 dark:border-teal-400/40 dark:bg-slate-900/70 shadow-sm group-hover:shadow-md dark:shadow-[0_0_0_1px_rgba(148,163,184,0.15)] dark:group-hover:shadow-[0_0_0_1px_rgba(148,163,184,0.28)] transition-all cursor-pointer">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-500/15 transition-colors">
                        <Cards size={32} weight="duotone" className="text-teal-500 dark:text-teal-300" aria-hidden="true" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Kortit</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                          Harjoittele aktiivista muistamista korttiharjoittelulla. Opettele uutta rauhalliseen tahtiin.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-center">
                      <div className="w-full max-w-[400px] md:max-w-[560px]">
                        <picture>
                          <source srcSet="/screenshots/quiz-mode.webp" type="image/webp" />
                          <Image
                            src="/screenshots/quiz-mode.png"
                            alt="Esimerkki korttiharjoittelusta: rauhallinen korttinäkymä ja käännä-nappi"
                            width={1200}
                            height={800}
                            loading="lazy"
                            sizes="(max-width: 768px) 90vw, 560px"
                            className="h-auto w-full rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm dark:shadow-[0_0_0_1px_rgba(148,163,184,0.18)] ring-1 ring-slate-200/70 dark:ring-slate-600/50 object-contain transition-colors"
                          />
                        </picture>
                        <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                          Esimerkki korttiharjoittelusta
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </section>

          <div className="scroll-fade border-t border-gray-100/70 dark:border-slate-800/70 pt-4 md:pt-6 transition-colors mt-6 md:mt-8" data-scroll>
            <AudienceTabs activeAudience={activeAudience} onAudienceChange={setActiveAudience} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
