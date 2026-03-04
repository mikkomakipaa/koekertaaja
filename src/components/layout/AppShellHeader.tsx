import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AppShellHeaderTone = 'default' | 'success' | 'warning' | 'danger';

interface AppShellHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  leadingAction?: ReactNode;
  trailingAction?: ReactNode;
  primaryAction?: ReactNode;
  tone?: AppShellHeaderTone;
  className?: string;
}

const toneStyles: Record<
  AppShellHeaderTone,
  {
    surface: string;
    icon: string;
    title: string;
    description: string;
  }
> = {
  default: {
    surface: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
    icon: 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/20',
    title: 'text-slate-900 dark:text-slate-100',
    description: 'text-slate-600 dark:text-slate-300',
  },
  success: {
    surface: 'border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/70 dark:bg-emerald-950/20',
    icon: 'bg-white text-emerald-600 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
    title: 'text-emerald-950 dark:text-emerald-50',
    description: 'text-emerald-800 dark:text-emerald-200',
  },
  warning: {
    surface: 'border-amber-200/80 bg-amber-50/80 dark:border-amber-900/70 dark:bg-amber-950/20',
    icon: 'bg-white text-amber-600 ring-1 ring-amber-200/80 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
    title: 'text-amber-950 dark:text-amber-50',
    description: 'text-amber-800 dark:text-amber-200',
  },
  danger: {
    surface: 'border-red-200/80 bg-red-50/80 dark:border-red-900/70 dark:bg-red-950/20',
    icon: 'bg-white text-red-600 ring-1 ring-red-200/80 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/20',
    title: 'text-red-950 dark:text-red-50',
    description: 'text-red-800 dark:text-red-200',
  },
};

export function AppShellHeader({
  icon,
  title,
  description,
  leadingAction,
  trailingAction,
  primaryAction,
  tone = 'default',
  className,
}: AppShellHeaderProps) {
  const styles = toneStyles[tone];

  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-colors',
        styles.surface,
        className
      )}
    >
      <div className="px-4 py-3.5 md:px-6 md:py-4">
        <div className="flex items-start gap-3">
          {leadingAction ? <div className="shrink-0">{leadingAction}</div> : null}

          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', styles.icon)}>{icon}</div>

            <div className="min-w-0 flex-1">
              <h1 className={cn('text-[22px] font-bold leading-[1.1] tracking-tight max-[480px]:text-[19px]', styles.title)}>
                {title}
              </h1>
              {description ? <p className={cn('mt-1.5 text-sm md:text-[15px]', styles.description)}>{description}</p> : null}
            </div>
          </div>

          {trailingAction ? <div className="shrink-0">{trailingAction}</div> : null}
        </div>

        {primaryAction ? <div className="mt-3.5">{primaryAction}</div> : null}
      </div>
    </section>
  );
}
