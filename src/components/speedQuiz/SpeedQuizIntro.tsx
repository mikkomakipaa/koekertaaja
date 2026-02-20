'use client';

import { useEffect, useState } from 'react';
import { Timer } from '@phosphor-icons/react';

export interface SpeedQuizIntroProps {
  questionSetName: string;
  onStart: () => void;
}

export const SPEED_QUIZ_COUNTDOWN_STEPS = ['3', '2', '1', 'Aloita!'] as const;

export type SpeedQuizCountdownStep = (typeof SPEED_QUIZ_COUNTDOWN_STEPS)[number];

interface SpeedQuizIntroCountdownController {
  start: () => void;
  stop: () => void;
}

/**
 * Controls the Aikahaaste intro flow by showing instructions first, then a
 * 3-2-1-Aloita countdown before invoking `onStart` so the timed quiz can begin.
 */
export function SpeedQuizIntro({ questionSetName, onStart }: SpeedQuizIntroProps) {
  const [state, setState] = useState<'ready' | 'countdown'>('ready');
  const [countdownStep, setCountdownStep] = useState<SpeedQuizCountdownStep>('3');

  useEffect(() => {
    if (state !== 'countdown') {
      return;
    }

    const countdown = createSpeedQuizIntroCountdown(setCountdownStep, onStart);
    countdown.start();

    return () => {
      countdown.stop();
    };
  }, [state, onStart]);

  if (state === 'countdown') {
    return (
      <section className="flex min-h-[65vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg font-semibold text-indigo-700 dark:text-indigo-300">Aikahaaste alkaa...</p>
          <p
            key={countdownStep}
            className="countdown-number text-6xl font-extrabold tracking-tight text-indigo-500 sm:text-8xl dark:text-indigo-300"
            aria-live="polite"
          >
            {countdownStep}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[65vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-indigo-300 bg-gradient-to-b from-indigo-100 to-violet-100 p-6 text-center shadow-lg dark:border-indigo-700 dark:from-indigo-950/50 dark:to-violet-950/40">
        <div className="mb-3 flex justify-center" aria-hidden="true">
          <Timer size={56} weight="duotone" className="text-indigo-600 dark:text-indigo-300" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-indigo-950 dark:text-indigo-100">Aikahaaste: {questionSetName}</h2>
        <ul className="mb-6 space-y-2 text-left text-base font-medium text-indigo-950 dark:text-indigo-100">
          <li>10 kysymystä</li>
          <li>15 sekuntia per kysymys</li>
          <li>Ei taukoja - ole valmis!</li>
        </ul>

        <button
          type="button"
          onClick={() => setState('countdown')}
          className="w-full rounded-xl bg-indigo-500 px-5 py-4 text-xl font-bold text-white transition-colors hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        >
          Valmis?
        </button>
      </div>
    </section>
  );
}

export function createSpeedQuizIntroCountdown(
  onStepChange: (step: SpeedQuizCountdownStep) => void,
  onComplete: () => void
): SpeedQuizIntroCountdownController {
  let currentStepIndex = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isRunning = false;

  const runNextStep = () => {
    currentStepIndex += 1;

    if (currentStepIndex < SPEED_QUIZ_COUNTDOWN_STEPS.length) {
      onStepChange(SPEED_QUIZ_COUNTDOWN_STEPS[currentStepIndex]);
      timeoutId = setTimeout(runNextStep, 1000);
      return;
    }

    stop();
    onComplete();
  };

  const stop = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    isRunning = false;
  };

  const start = () => {
    if (isRunning) {
      return;
    }

    isRunning = true;
    currentStepIndex = 0;
    onStepChange(SPEED_QUIZ_COUNTDOWN_STEPS[currentStepIndex]);
    timeoutId = setTimeout(runNextStep, 1000);
  };

  return { start, stop };
}
