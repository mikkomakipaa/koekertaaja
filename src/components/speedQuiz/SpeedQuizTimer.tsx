interface SpeedQuizTimerProps {
  timeRemaining: number;
  timeLimit: number;
  colorState: 'safe' | 'warning' | 'critical';
  placement?: 'fixed' | 'inline';
}

const COLOR_STATE_CLASS: Record<SpeedQuizTimerProps['colorState'], string> = {
  safe: 'bg-emerald-500',
  warning: 'bg-amber-500 animate-pulse-subtle',
  critical: 'bg-red-500 animate-pulse-fast',
};

/**
 * Shows a fixed top timer bar for Speed Quiz questions.
 *
 * `timeRemaining` and `timeLimit` control the bar width (100% -> 0%),
 * while `colorState` controls visual urgency (`safe`, `warning`, `critical`).
 */
export function SpeedQuizTimer({ timeRemaining, timeLimit, colorState, placement = 'fixed' }: SpeedQuizTimerProps) {
  const safeTimeLimit = timeLimit > 0 ? timeLimit : 1;
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / safeTimeLimit) * 100));
  const roundedSeconds = Math.max(0, Math.ceil(timeRemaining));
  const placementClasses =
    placement === 'fixed' ? 'fixed top-0 left-0 right-0 z-50' : 'relative w-full';

  return (
    <div
      className={`${placementClasses} h-2 bg-slate-200 dark:bg-slate-800`}
      role="timer"
      aria-live="polite"
      aria-label={`Aikaa jäljellä: ${roundedSeconds} sekuntia`}
    >
      <div
        className={`h-full transition-all duration-100 linear ease-linear ${COLOR_STATE_CLASS[colorState]}`}
        style={{ width: `${progressPercent}%` }}
      />
      <span className="absolute right-2 top-0 text-xs text-slate-600 dark:text-slate-400">
        {roundedSeconds}s
      </span>
    </div>
  );
}

export type { SpeedQuizTimerProps };
