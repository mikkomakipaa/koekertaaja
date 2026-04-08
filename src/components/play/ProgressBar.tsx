interface ProgressBarProps {
  current: number;
  total: number;
  mode?: 'quiz' | 'flashcard';
  variant?: 'default' | 'header';
  label?: string;
  hideMobileCompleteLabel?: boolean;
}

export function ProgressBar({
  current,
  total,
  mode = 'quiz',
  variant = 'default',
  label = 'Edistyminen',
  hideMobileCompleteLabel = false,
}: ProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;
  const progress = (current / safeTotal) * 100;
  const progressRounded = Math.round(progress);
  const barColor =
    mode === 'flashcard'
      ? 'bg-teal-600 dark:bg-teal-500'
      : 'bg-indigo-600 dark:bg-indigo-500';
  const labelColor =
    mode === 'flashcard'
      ? 'text-teal-600 dark:text-teal-400'
      : 'text-indigo-600 dark:text-indigo-400';

  if (variant === 'header') {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-white/90 sm:text-sm">
          <span className="truncate">{label}</span>
          <span className="shrink-0">{progressRounded}%</span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-white/20 sm:h-2"
          role="progressbar"
          aria-label={label}
          aria-valuenow={progressRounded}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${label}, ${progressRounded}%`}
        >
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Edistyminen
        </span>
        <span className={`text-sm font-bold ${labelColor}`}>
          <span className={hideMobileCompleteLabel ? 'sm:hidden' : 'hidden'}>{progressRounded}%</span>
          <span className={hideMobileCompleteLabel ? 'hidden sm:inline' : 'inline'}>{progressRounded}% valmis</span>
        </span>
      </div>
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={progressRounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${label}, ${progressRounded}%`}
      >
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
