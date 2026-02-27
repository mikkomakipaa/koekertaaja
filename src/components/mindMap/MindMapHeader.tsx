'use client';

import { ArrowCounterClockwise, ArrowLeft, MagnifyingGlassMinus } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-tokens';

interface MindMapHeaderProps {
  title: string;
  subtitle?: string;
  scale: number;
  onBack: () => void;
  onRefresh: () => void;
  onResetZoom: () => void;
}

export function MindMapHeader({
  title,
  subtitle,
  scale,
  onBack,
  onRefresh,
  onResetZoom,
}: MindMapHeaderProps) {
  return (
    <header className={`rounded-2xl border border-violet-200 bg-white p-3 dark:border-violet-800/70 dark:bg-gray-900 ${colors.map.light}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={`h-12 min-w-12 rounded-xl focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${colors.map.ring}`}
            onClick={onBack}
            aria-label="Takaisin"
          >
            <ArrowLeft size={18} weight="bold" />
            Takaisin
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
            {subtitle ? <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p> : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className={`h-12 min-w-12 rounded-xl focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${colors.map.ring}`}
            onClick={onRefresh}
            aria-label="Päivitä hallinta"
          >
            <ArrowCounterClockwise size={18} weight="bold" />
            Päivitä
          </Button>
          <Button
            type="button"
            variant="outline"
            className={`h-12 min-w-12 rounded-xl focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900 ${colors.map.ring}`}
            onClick={onResetZoom}
            aria-label="Palauta zoomaus"
          >
            <MagnifyingGlassMinus size={18} weight="bold" />
            Zoom {Math.round(scale * 100)} %
          </Button>
        </div>
      </div>
    </header>
  );
}
