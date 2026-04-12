'use client';

import { CircleNotch, CheckCircle, XCircle, Cards, ClipboardText } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { colors } from '@/lib/design-tokens';

interface CreationStep {
  id: string;
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  metadata?: {
    count?: number;
    message?: string;
    topics?: string[];
  };
}

interface GroupedProgressStepperProps {
  steps: CreationStep[];
  onRetry?: (stepId: string) => void;
}

interface TopicGroup {
  index: number;
  label: string;
  quizStep: CreationStep | undefined;
  flashcardStep: CreationStep | undefined;
}

function StatusIcon({ status, size = 16 }: { status: CreationStep['status']; size?: number }) {
  if (status === 'completed') {
    return <CheckCircle weight="duotone" size={size} className="text-emerald-600 dark:text-emerald-300" />;
  }
  if (status === 'in_progress') {
    return <CircleNotch weight="bold" size={size} className="animate-spin text-indigo-600 dark:text-indigo-300" />;
  }
  if (status === 'error') {
    return <XCircle weight="duotone" size={size} className="text-rose-600 dark:text-rose-300" />;
  }
  return <CircleNotch weight="bold" size={size} className="text-slate-400 dark:text-slate-500" />;
}

function ModeChip({
  step,
  label,
  icon,
  onRetry,
}: {
  step: CreationStep;
  label: string;
  icon: React.ReactNode;
  onRetry?: (stepId: string) => void;
}) {
  const isError = step.status === 'error';
  const isCompleted = step.status === 'completed';
  const isActive = step.status === 'in_progress';

  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-1 rounded-lg border px-3 py-2 text-xs transition-all',
        isCompleted && 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-900/20',
        isActive && 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-800/60 dark:bg-indigo-900/20',
        isError && 'border-rose-200 bg-rose-50/60 dark:border-rose-800/60 dark:bg-rose-900/20',
        !isCompleted && !isActive && !isError && 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40',
      )}
    >
      <div className="flex items-center gap-1.5">
        <StatusIcon status={step.status} size={13} />
        <span className={cn(
          'flex items-center gap-1 font-medium',
          isCompleted && 'text-emerald-900 dark:text-emerald-100',
          isActive && 'text-indigo-900 dark:text-indigo-100',
          isError && 'text-rose-900 dark:text-rose-100',
          !isCompleted && !isActive && !isError && 'text-slate-600 dark:text-slate-300',
        )}>
          {icon}
          {label}
        </span>
        {isCompleted && step.metadata?.count !== undefined && (
          <span className="ml-auto rounded-full bg-emerald-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
            {step.metadata.count} kpl
          </span>
        )}
      </div>
      {step.metadata?.message && (isActive || isError) && (
        <p className={cn(
          'truncate text-[11px]',
          isActive && 'text-indigo-700 dark:text-indigo-300',
          isError && 'text-rose-700 dark:text-rose-300',
        )}>
          {step.metadata.message}
        </p>
      )}
      {isError && onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 h-7 border-rose-300 bg-white/80 px-2 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-950/40 dark:text-rose-200 dark:hover:bg-rose-950/30"
          onClick={() => onRetry(step.id)}
        >
          Yritä uudelleen
        </Button>
      )}
    </div>
  );
}

export function GroupedProgressStepper({ steps, onRetry }: GroupedProgressStepperProps) {
  const topicsStep = steps.find((s) => s.id === 'topics');
  const quizSteps = steps.filter(
    (s) => s.id.startsWith('topic-') && !s.id.startsWith('flashcard-topic-')
  );
  const flashcardSteps = steps.filter((s) => s.id.startsWith('flashcard-topic-'));

  const topicCount = Math.max(quizSteps.length, flashcardSteps.length);
  const groups: TopicGroup[] = Array.from({ length: topicCount }, (_, i) => {
    const quizStep = quizSteps.find((s) => s.id === `topic-${i}`);
    const flashcardStep = flashcardSteps.find((s) => s.id === `flashcard-topic-${i}`);
    const rawLabel = quizStep?.label ?? flashcardStep?.label?.replace(' (Muistikortit)', '') ?? `Aihe ${i + 1}`;
    return { index: i, label: rawLabel, quizStep, flashcardStep };
  });

  const hasFlashcard = flashcardSteps.length > 0;
  const hasQuiz = quizSteps.length > 0;

  return (
    <div className="space-y-2">
      {/* Topics identification step */}
      {topicsStep && (
        <div
          className={cn(
            'rounded-xl border px-4 py-3 transition-all',
            topicsStep.status === 'completed' &&
              'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800/60 dark:bg-emerald-900/20',
            topicsStep.status === 'in_progress' &&
              'border-indigo-200 bg-indigo-50/60 dark:border-indigo-800/60 dark:bg-indigo-900/20',
            topicsStep.status === 'error' &&
              'border-rose-200 bg-rose-50/70 dark:border-rose-800/60 dark:bg-rose-900/20',
            topicsStep.status === 'pending' &&
              'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40',
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 rounded-full bg-white/90 p-1.5 shadow-sm dark:bg-slate-950/60">
              <StatusIcon status={topicsStep.status} size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn(
                'text-sm font-semibold',
                topicsStep.status === 'completed' && 'text-emerald-900 dark:text-emerald-100',
                topicsStep.status === 'in_progress' && 'text-indigo-900 dark:text-indigo-100',
                topicsStep.status === 'error' && 'text-rose-900 dark:text-rose-100',
                topicsStep.status === 'pending' && 'text-slate-600 dark:text-slate-300',
              )}>
                {topicsStep.label}
              </p>
              {topicsStep.metadata?.topics && topicsStep.status === 'completed' && (
                <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {topicsStep.metadata.topics.join(' · ')}
                </p>
              )}
              {topicsStep.metadata?.message && topicsStep.status !== 'completed' && (
                <p className={cn(
                  'mt-0.5 text-xs',
                  topicsStep.status === 'in_progress' && 'text-indigo-700 dark:text-indigo-300',
                  topicsStep.status === 'error' && 'text-rose-700 dark:text-rose-300',
                  topicsStep.status === 'pending' && 'text-slate-500 dark:text-slate-400',
                )}>
                  {topicsStep.metadata.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Topic groups */}
      {groups.length > 0 && (
        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.index}
              className={cn(
                'rounded-xl border px-4 py-3',
                colors.border.standard,
                colors.bg.base,
              )}
            >
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {group.label}
              </p>
              <div className={cn('flex gap-2', hasQuiz && hasFlashcard ? 'flex-row' : 'flex-col')}>
                {group.quizStep && (
                  <ModeChip
                    step={group.quizStep}
                    label="Koe"
                    icon={<ClipboardText size={11} weight="duotone" />}
                    onRetry={onRetry}
                  />
                )}
                {group.flashcardStep && (
                  <ModeChip
                    step={group.flashcardStep}
                    label="Kortit"
                    icon={<Cards size={11} weight="duotone" />}
                    onRetry={onRetry}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
