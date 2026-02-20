'use client';

import { useMemo, useState } from 'react';
import { Lightning, CaretDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { SpeedQuizResult } from '@/types';

interface SpeedQuizResultsProps {
  result: SpeedQuizResult;
  questionSetCode: string;
  questionSetName: string;
  onRetry: () => void;
  onChooseAnother: () => void;
  onGoHome: () => void;
}

type QuestionStatus = SpeedQuizResult['questions'][number]['status'];

const STATUS_META: Record<
  QuestionStatus,
  {
    icon: string;
    chipClassName: string;
    rowBorderClassName: string;
    rowBgClassName: string;
  }
> = {
  correct: {
    icon: '✓',
    chipClassName:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    rowBorderClassName: 'border-emerald-200 dark:border-emerald-800/50',
    rowBgClassName: 'bg-emerald-50/70 dark:bg-emerald-950/20',
  },
  wrong: {
    icon: '✗',
    chipClassName: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    rowBorderClassName: 'border-red-200 dark:border-red-800/50',
    rowBgClassName: 'bg-red-50/70 dark:bg-red-950/20',
  },
  skipped: {
    icon: '⏭',
    chipClassName:
      'bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300',
    rowBorderClassName: 'border-slate-200 dark:border-slate-700',
    rowBgClassName: 'bg-slate-50/70 dark:bg-slate-900/40',
  },
};

const PREVIEW_LIMIT = 100;

export function formatApproxSeconds(totalTime: number): string {
  const safeSeconds = Number.isFinite(totalTime) ? Math.max(0, Math.round(totalTime)) : 0;
  return `~${safeSeconds} sekuntia`;
}

export function truncateQuestionText(text: string, maxLength: number = PREVIEW_LIMIT): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trimEnd()}...`;
}

export function toggleExpandedQuestion(
  currentQuestionId: string | null,
  nextQuestionId: string
): string | null {
  return currentQuestionId === nextQuestionId ? null : nextQuestionId;
}

export function createSpeedQuizResultsActionHandlers(handlers: {
  onRetry: () => void;
  onChooseAnother: () => void;
  onGoHome: () => void;
}) {
  return {
    handleRetry: () => handlers.onRetry(),
    handleChooseAnother: () => handlers.onChooseAnother(),
    handleGoHome: () => handlers.onGoHome(),
  };
}

/**
 * Renders the final Aikahaaste summary with score stats, per-question outcomes,
 * and action buttons for replay/navigation.
 */
export function SpeedQuizResults({
  result,
  questionSetCode,
  questionSetName,
  onRetry,
  onChooseAnother,
  onGoHome,
}: SpeedQuizResultsProps) {
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const actions = useMemo(
    () =>
      createSpeedQuizResultsActionHandlers({
        onRetry,
        onChooseAnother,
        onGoHome,
      }),
    [onRetry, onChooseAnother, onGoHome]
  );

  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white px-4 py-6 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto w-full max-w-4xl space-y-5 pb-24">
        <Card variant="frosted" padding="none" className="overflow-hidden">
          <div className="border-b border-emerald-200 bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white dark:border-emerald-700/40">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-50/90">
              <Lightning size={18} weight="fill" />
              Aikahaaste
            </div>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">Aikahaaste suoritettu!</h2>
            <p className="mt-1 text-sm text-emerald-50/90">{questionSetName} ({questionSetCode})</p>
          </div>
          <CardContent className="grid gap-4 p-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Lopullinen pistemäärä
              </p>
              <p className="text-4xl font-black text-emerald-700 dark:text-emerald-300">{result.score}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Kokonaisaika
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatApproxSeconds(result.totalTime)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Paras putki
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {result.bestStreak} oikein peräkkäin
              </p>
            </div>
          </CardContent>
        </Card>

        <Card variant="frosted" padding="standard">
          <CardContent className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Tulosten jakauma</h3>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✓ Oikein</p>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {result.correctCount}/10
                </p>
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-950/20">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">✗ Väärin</p>
                <p className="text-xl font-extrabold text-red-700 dark:text-red-300">{result.wrongCount}/10</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">⏭ Ohitettu</p>
                <p className="text-xl font-extrabold text-slate-500 dark:text-slate-300">
                  {result.skippedCount}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="frosted" padding="standard">
          <CardContent>
            <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-slate-100">Kysymyskohtaiset tulokset</h3>
            <ul className="space-y-2">
              {result.questions.map((question, index) => {
                const isExpanded = expandedQuestionId === question.id;
                const statusMeta = STATUS_META[question.status];
                return (
                  <li key={question.id}>
                    <div
                      className={cn(
                        'overflow-hidden rounded-xl border transition-colors',
                        statusMeta.rowBorderClassName,
                        statusMeta.rowBgClassName
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                        onClick={() =>
                          setExpandedQuestionId((current) =>
                            toggleExpandedQuestion(current, question.id)
                          )
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`speed-quiz-question-${question.id}`}
                      >
                        <span
                          className={cn(
                            'inline-flex min-h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-bold',
                            statusMeta.chipClassName
                          )}
                        >
                          {statusMeta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            Kysymys {index + 1}
                          </p>
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                            {truncateQuestionText(question.question)}
                          </p>
                        </div>
                        <CaretDown
                          size={18}
                          className={cn(
                            'text-slate-500 transition-transform duration-300 dark:text-slate-400',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </button>

                      <div
                        id={`speed-quiz-question-${question.id}`}
                        className={cn(
                          'grid transition-all duration-300 ease-in-out',
                          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                        )}
                      >
                        <div className="overflow-hidden px-3 pb-3">
                          <div className="rounded-lg border border-slate-200 bg-white/80 p-3 text-sm dark:border-slate-700 dark:bg-gray-900/70">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {question.question}
                            </p>
                            {question.status === 'correct' && (
                              <p className="mt-2 text-emerald-700 dark:text-emerald-300">
                                Oikea vastaus: <span className="font-semibold">{question.correctAnswer}</span>
                              </p>
                            )}
                            {question.status === 'wrong' && (
                              <div className="mt-2 space-y-1">
                                <p className="text-red-700 dark:text-red-300">
                                  Valitsit:{' '}
                                  <span className="font-semibold">
                                    {question.userAnswer?.trim() || 'Ei vastausta'}
                                  </span>
                                </p>
                                <p className="text-emerald-700 dark:text-emerald-300">
                                  Oikea vastaus: <span className="font-semibold">{question.correctAnswer}</span>
                                </p>
                              </div>
                            )}
                            {question.status === 'skipped' && (
                              <p className="mt-2 text-slate-600 dark:text-slate-300">
                                Ohitettu -{' '}
                                <span className="text-emerald-700 dark:text-emerald-300">
                                  Oikea vastaus: <span className="font-semibold">{question.correctAnswer}</span>
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10">
          <Card variant="frosted" padding="compact">
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Button
                onClick={actions.handleRetry}
                className="bg-amber-500 text-amber-950 hover:bg-amber-400 focus-visible:ring-amber-400"
              >
                Yritä uudelleen
              </Button>
              <Button
                variant="secondary"
                onClick={actions.handleChooseAnother}
                className="border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Valitse toinen sarja
              </Button>
              <Button
                variant="secondary"
                onClick={actions.handleGoHome}
                className="border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Palaa etusivulle
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export type { SpeedQuizResultsProps };
