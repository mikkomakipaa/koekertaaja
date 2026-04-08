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
    border: 'border-amber-300/80 bg-amber-50/80 dark:border-amber-700/70 dark:bg-amber-950/25',
    progress: 'bg-amber-500 dark:bg-amber-400',
    status: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200',
  },
  mid: {
    border: 'border-sky-200/80 bg-sky-50/80 dark:border-sky-800/70 dark:bg-sky-950/20',
    progress: 'bg-sky-500 dark:bg-sky-400',
    status: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200',
  },
  strong: {
    border: 'border-emerald-200/80 bg-emerald-50/75 dark:border-emerald-800/70 dark:bg-emerald-950/20',
    progress: 'bg-emerald-500 dark:bg-emerald-400',
    status: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200',
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
                  className={cn('rounded-xl border p-4', tone.border)}
                  data-testid={`topic-card-${encodeURIComponent(item.topic)}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-slate-950 dark:text-slate-50">{item.topic}</p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
                        <span>{item.correct}/{item.total} oikein</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                      </div>

                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/80 dark:bg-slate-900/60">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500 ease-out', tone.progress)}
                          style={{ width: `${item.percentage}%` }}
                          role="progressbar"
                          aria-label={`${item.topic}: ${item.percentage}% hallinnassa`}
                          aria-valuenow={item.percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                    </div>

                    {item.reviewHref ? (
                      <Button asChild mode="study" variant="primary" className="w-full sm:w-auto" size="sm">
                        <Link href={item.reviewHref}>
                          Opettele
                          <ArrowRight size={14} weight="bold" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : null}
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
