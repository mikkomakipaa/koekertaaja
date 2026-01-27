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
      className={cn('space-y-4', className)}
    >
      {steps.map((step) => (
        <div
          key={step.id}
          role="listitem"
          aria-label={`${step.label}: ${step.status}`}
          className={cn(
            'p-4 rounded-lg border-2 transition-all',
            step.status === 'completed' &&
              'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
            step.status === 'in_progress' &&
              'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600',
            step.status === 'error' &&
              'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
            step.status === 'pending' &&
              'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600'
          )}
        >
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.status === 'completed' && (
                <CheckCircle
                  weight="duotone"
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                />
              )}
              {step.status === 'in_progress' && (
                <CircleNotch
                  weight="bold"
                  className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin"
                />
              )}
              {step.status === 'error' && (
                <XCircle
                  weight="duotone"
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                />
              )}
              {step.status === 'pending' && (
                <CircleNotch
                  weight="bold"
                  className="w-6 h-6 text-gray-400 dark:text-gray-500"
                />
              )}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  'font-semibold text-base',
                  step.status === 'completed' && 'text-green-800 dark:text-green-200',
                  step.status === 'in_progress' && 'text-blue-800 dark:text-blue-200',
                  step.status === 'error' && 'text-red-800 dark:text-red-200',
                  step.status === 'pending' && 'text-gray-600 dark:text-gray-400'
                )}
              >
                {step.label}
              </h3>

              {/* Metadata display */}
              {step.metadata?.message && (
                <p
                  className={cn(
                    'text-sm mt-1',
                    step.status === 'completed' && 'text-green-700 dark:text-green-300',
                    step.status === 'in_progress' && 'text-blue-700 dark:text-blue-300',
                    step.status === 'error' && 'text-red-700 dark:text-red-300',
                    step.status === 'pending' && 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.metadata.message}
                </p>
              )}

              {step.metadata?.count !== undefined && step.status === 'completed' && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  {step.metadata.count} kohdetta
                </p>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Overall Progress */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Edistyminen</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            {completedCount} / {totalCount} vaihetta valmis
          </span>
        </div>
      </div>
    </div>
  );
}
