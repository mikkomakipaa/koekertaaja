'use client';

import { ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/ui/section-heading';
import { cn } from '@/lib/utils';
import type { TopicMasteryItem } from '@/lib/play/results-screen';

interface TopicMasterySectionProps {
  items: TopicMasteryItem[];
}

const toneClasses = {
  weak: {
    card: 'border-amber-300 bg-white dark:border-amber-800/80 dark:bg-slate-900',
    percentage: 'text-amber-900 dark:text-amber-100',
  },
  mid: {
    card: 'border-sky-300 bg-white dark:border-sky-800/80 dark:bg-slate-900',
    percentage: 'text-sky-900 dark:text-sky-100',
  },
  strong: {
    card: 'border-emerald-300 bg-white dark:border-emerald-800/80 dark:bg-slate-900',
    percentage: 'text-emerald-900 dark:text-emerald-100',
  },
} as const;

export function TopicMasterySection({ items }: TopicMasterySectionProps) {
  const weakItems = items.filter((item) => item.level === 'weak');

  return (
    <Card
      variant="standard"
      padding="none"
      className="rounded-xl border-slate-200 shadow-none dark:border-slate-800"
      data-testid="results-topic-mastery"
    >
      <CardContent className="p-5">
        <div className="min-w-0">
          <SectionHeading>Aiheiden hallinta</SectionHeading>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {weakItems.length > 0
              ? 'Aloita heikoimmista aiheista. Jokaisesta kortista paasee suoraan kertaukseen.'
              : 'Heikkoja aiheita ei loytynyt. Voit pelata uudelleen tai tarkistaa yksittaiset vastaukset alta.'}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            Aihekohtaista hallintadataa ei ole viela saatavilla.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {items.map((item) => {
              const tone = toneClasses[item.level];

              return (
                <div
                  key={item.topic}
                  className={cn('rounded-xl border p-4 shadow-sm shadow-slate-950/[0.03]', tone.card)}
                  data-testid={`topic-card-${encodeURIComponent(item.topic)}`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-slate-950 dark:text-slate-50">{item.topic}</p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                          <span>{item.correct}/{item.total} oikein</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <p className={cn('text-lg font-semibold tracking-tight', tone.percentage)}>{item.percentage}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
                      {item.playHref ? (
                        <Button
                          asChild
                          mode="quiz"
                          variant="primary"
                          className="min-h-11 w-full rounded-lg sm:w-auto"
                        >
                          <Link href={item.playHref}>
                            Pelaa
                            <ArrowRight size={14} weight="bold" aria-hidden="true" />
                          </Link>
                        </Button>
                      ) : null}

                      {item.reviewHref ? (
                        <Button
                          asChild
                          mode="study"
                          variant="primary"
                          className="min-h-11 w-full rounded-lg bg-teal-600 text-white shadow-md hover:bg-teal-700 hover:shadow-lg dark:bg-teal-600 dark:hover:bg-teal-500 sm:w-auto"
                        >
                          <Link href={item.reviewHref}>
                            Opettele
                            <ArrowRight size={14} weight="bold" aria-hidden="true" />
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
