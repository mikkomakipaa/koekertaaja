'use client';

import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlaySessionHeader } from '@/components/play/PlaySessionHeader';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react';

interface PlayTopicSelectorOption {
  key: string;
  title: string;
  description: string;
  onSelect: () => void;
  emphasized?: boolean;
}

interface PlayTopicSelectorProps {
  tone: 'quiz' | 'flashcard';
  title: string;
  subtitle?: string;
  icon: ReactNode;
  onBack: () => void;
  options: PlayTopicSelectorOption[];
}

export function PlayTopicSelector({
  tone,
  title,
  subtitle,
  icon,
  onBack,
  options,
}: PlayTopicSelectorProps) {
  const emphasizedCardClassName =
    tone === 'flashcard'
      ? 'border-teal-300/80 bg-teal-50/70 dark:border-teal-700/70 dark:bg-teal-950/20'
      : 'border-indigo-300/80 bg-indigo-50/70 dark:border-indigo-700/70 dark:bg-indigo-950/20';
  const emphasizedArrowClassName =
    tone === 'flashcard' ? 'text-teal-600 dark:text-teal-400' : 'text-indigo-600 dark:text-indigo-400';

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <PlaySessionHeader
        tone={tone}
        title={title}
        subtitle={subtitle}
        icon={icon}
        actionLabel="Takaisin"
        actionIcon={<ArrowLeft size={18} weight="bold" />}
        onAction={onBack}
      />

      <div className="mx-auto max-w-4xl px-4 py-3 md:py-8">
        <div className="space-y-3">
          {options.map((option) => (
            <Card
              key={option.key}
              variant="interactive"
              padding="none"
              className={cn(option.emphasized ? emphasizedCardClassName : undefined)}
              role="button"
              tabIndex={0}
              onClick={option.onSelect}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  option.onSelect();
                }
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    weight="bold"
                    className={cn(
                      'shrink-0 text-slate-400 dark:text-slate-500',
                      option.emphasized && emphasizedArrowClassName
                    )}
                    aria-hidden="true"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
