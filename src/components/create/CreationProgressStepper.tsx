import { CircleNotch, CheckCircle, XCircle } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface CreationStep {
  id: string;
  label: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  metadata?: {
    count?: number;
    message?: string;
  };
}

interface CreationProgressStepperProps {
  steps: CreationStep[];
  className?: string;
}

export function CreationProgressStepper({ steps, className }: CreationProgressStepperProps) {
  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      className={cn('space-y-3', className)}
    >
      {steps.map((step) => (
        <div
          key={step.id}
          role="listitem"
          aria-label={`${step.label}: ${step.status}`}
          className={cn(
            'rounded-xl border px-4 py-3 transition-all',
            step.status === 'completed' &&
              'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-900/20',
            step.status === 'in_progress' &&
              'border-indigo-200 bg-indigo-50/60 dark:border-indigo-800/60 dark:bg-indigo-900/20',
            step.status === 'error' &&
              'border-rose-200 bg-rose-50/70 dark:border-rose-800/60 dark:bg-rose-900/20',
            step.status === 'pending' &&
              'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5 rounded-full bg-white/90 p-2 shadow-sm dark:bg-slate-950/60">
              {step.status === 'completed' && (
                <CheckCircle
                  weight="duotone"
                  className="w-5 h-5 text-emerald-600 dark:text-emerald-300"
                />
              )}
              {step.status === 'in_progress' && (
                <CircleNotch
                  weight="bold"
                  className="w-5 h-5 text-indigo-600 dark:text-indigo-300 animate-spin"
                />
              )}
              {step.status === 'error' && (
                <XCircle
                  weight="duotone"
                  className="w-5 h-5 text-rose-600 dark:text-rose-300"
                />
              )}
              {step.status === 'pending' && (
                <CircleNotch
                  weight="bold"
                  className="w-5 h-5 text-slate-400 dark:text-slate-500"
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-semibold text-sm sm:text-base',
                  step.status === 'completed' && 'text-emerald-900 dark:text-emerald-100',
                  step.status === 'in_progress' && 'text-indigo-900 dark:text-indigo-100',
                  step.status === 'error' && 'text-rose-900 dark:text-rose-100',
                  step.status === 'pending' && 'text-slate-600 dark:text-slate-300'
                )}
              >
                {step.label}
              </h3>

              {/* Metadata display */}
              {step.metadata?.message && (
                <p
                  className={cn(
                    'text-xs sm:text-sm mt-1',
                    step.status === 'completed' && 'text-emerald-700 dark:text-emerald-300',
                    step.status === 'in_progress' && 'text-indigo-700 dark:text-indigo-300',
                    step.status === 'error' && 'text-rose-700 dark:text-rose-300',
                    step.status === 'pending' && 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {step.metadata.message}
                </p>
              )}

              {step.metadata?.count !== undefined && step.status === 'completed' && (
                <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  {step.metadata.count} items
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Overall Progress */}
      <div className="pt-3 border-t border-slate-200/70 dark:border-slate-800">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="font-medium text-slate-600 dark:text-slate-300">Progress</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-300">
            {completedCount} / {totalCount} steps done
          </span>
        </div>
      </div>
    </div>
  );
}
