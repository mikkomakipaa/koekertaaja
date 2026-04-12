import { CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface CreationFlowBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

const STEPS = [
  { id: 1 as const, label: 'Tiedot' },
  { id: 2 as const, label: 'Aihealueet' },
  { id: 3 as const, label: 'Luodaan' },
  { id: 4 as const, label: 'Valmis' },
];

export function CreationFlowBar({ currentStep }: CreationFlowBarProps) {
  return (
    <nav aria-label="Luonnin vaiheet" className="pb-1">
      <ol className="flex items-start">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-start last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
                    (isCompleted || (isActive && step.id === 4)) &&
                      'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-600 dark:bg-emerald-600',
                    isActive &&
                      step.id !== 4 &&
                      'border-indigo-500 bg-white text-indigo-600 ring-4 ring-indigo-100 dark:bg-slate-900 dark:ring-indigo-950/60',
                    !isCompleted &&
                      !isActive &&
                      'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
                  )}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isActive && step.id === 3 ? (
                    <CircleNotch weight="bold" className="h-3.5 w-3.5 animate-spin" />
                  ) : isCompleted || (isActive && step.id === 4) ? (
                    <CheckCircle weight="fill" className="h-4 w-4" />
                  ) : (
                    <span className="text-[10px] font-bold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'whitespace-nowrap text-[11px] font-medium',
                    isActive && step.id !== 4 && 'text-indigo-600 dark:text-indigo-400',
                    (isCompleted || (isActive && step.id === 4)) && 'text-emerald-600 dark:text-emerald-400',
                    !isCompleted && !isActive && 'text-slate-400 dark:text-slate-500',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1.5 mt-3 h-0.5 flex-1 transition-colors',
                    step.id < currentStep
                      ? 'bg-emerald-400 dark:bg-emerald-600'
                      : 'bg-slate-200 dark:bg-slate-700',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
