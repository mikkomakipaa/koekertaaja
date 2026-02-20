import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TimerColorState = 'safe' | 'warning' | 'critical';

export interface SpeedQuizTimerState {
  timeRemaining: number;
  colorState: TimerColorState;
  isRunning: boolean;
}

const TICK_INTERVAL_MS = 100;

const clampTimeLimit = (timeLimit: number) => Math.max(0, timeLimit);

export const getTimerColorState = (timeRemaining: number): TimerColorState => {
  if (timeRemaining >= 4) return 'safe';
  if (timeRemaining >= 2) return 'warning';
  return 'critical';
};

/**
 * Creates a timer controller used by `useSpeedQuizTimer`.
 * This is exported for unit testing the timer logic without rendering React components.
 */
export function createSpeedQuizTimerController(
  timeLimit: number,
  onExpire: () => void
) {
  let currentTimeLimit = clampTimeLimit(timeLimit);
  let timeRemaining = currentTimeLimit;
  let isRunning = false;
  let elapsedBeforeStartMs = 0;
  let startedAtMs: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let hasExpired = currentTimeLimit === 0;
  let onExpireCallback = onExpire;
  const subscribers = new Set<(state: SpeedQuizTimerState) => void>();

  const publish = () => {
    const state: SpeedQuizTimerState = {
      timeRemaining,
      colorState: getTimerColorState(timeRemaining),
      isRunning,
    };
    subscribers.forEach((subscriber) => subscriber(state));
  };

  const clearTicker = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const applyElapsedTime = (elapsedMs: number) => {
    const nextRemaining = Math.max(0, currentTimeLimit - elapsedMs / 1000);
    timeRemaining = nextRemaining;

    if (nextRemaining === 0) {
      clearTicker();
      isRunning = false;
      startedAtMs = null;
      elapsedBeforeStartMs = currentTimeLimit * 1000;
      if (!hasExpired) {
        hasExpired = true;
        onExpireCallback();
      }
    }

    publish();
  };

  const tick = () => {
    if (startedAtMs === null) return;
    const elapsedMs = elapsedBeforeStartMs + (Date.now() - startedAtMs);
    applyElapsedTime(elapsedMs);
  };

  const start = () => {
    if (isRunning || timeRemaining <= 0) return;

    startedAtMs = Date.now();
    isRunning = true;
    clearTicker();
    intervalId = setInterval(tick, TICK_INTERVAL_MS);
    tick();
  };

  const stop = () => {
    if (!isRunning) return;

    if (startedAtMs !== null) {
      elapsedBeforeStartMs += Date.now() - startedAtMs;
      startedAtMs = null;
    }

    clearTicker();
    isRunning = false;
    publish();
  };

  const reset = () => {
    clearTicker();
    startedAtMs = null;
    elapsedBeforeStartMs = 0;
    isRunning = false;
    hasExpired = currentTimeLimit === 0;
    timeRemaining = currentTimeLimit;
    publish();
  };

  const setTimeLimit = (nextTimeLimit: number) => {
    currentTimeLimit = clampTimeLimit(nextTimeLimit);
    reset();
  };

  const setOnExpire = (nextOnExpire: () => void) => {
    onExpireCallback = nextOnExpire;
  };

  const getState = (): SpeedQuizTimerState => ({
    timeRemaining,
    colorState: getTimerColorState(timeRemaining),
    isRunning,
  });

  const subscribe = (listener: (state: SpeedQuizTimerState) => void) => {
    subscribers.add(listener);
    listener(getState());
    return () => {
      subscribers.delete(listener);
    };
  };

  const dispose = () => {
    clearTicker();
    subscribers.clear();
    isRunning = false;
    startedAtMs = null;
  };

  return {
    start,
    stop,
    reset,
    setTimeLimit,
    setOnExpire,
    getState,
    subscribe,
    dispose,
  };
}

/**
 * Hook for a Aikahaaste countdown timer.
 *
 * @param timeLimit Countdown length in seconds.
 * @param onExpire Callback triggered exactly once when the timer reaches 0.
 * @returns Current time, color state, running state, and timer controls.
 */
export const useSpeedQuizTimer = (
  timeLimit: number,
  onExpire: () => void
): {
  timeRemaining: number;
  colorState: TimerColorState;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
} => {
  const controllerRef = useRef<ReturnType<typeof createSpeedQuizTimerController> | null>(null);
  const onExpireRef = useRef(onExpire);
  const [timeRemaining, setTimeRemaining] = useState(() => clampTimeLimit(timeLimit));
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const controller = createSpeedQuizTimerController(timeLimit, () => onExpireRef.current());
    controllerRef.current = controller;

    const unsubscribe = controller.subscribe((state) => {
      setTimeRemaining(state.timeRemaining);
      setIsRunning(state.isRunning);
    });

    return () => {
      unsubscribe();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [timeLimit]);

  const start = useCallback(() => {
    controllerRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    controllerRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.reset();
  }, []);

  const colorState = useMemo(() => getTimerColorState(timeRemaining), [timeRemaining]);

  return {
    timeRemaining,
    colorState,
    isRunning,
    start,
    stop,
    reset,
  };
};

