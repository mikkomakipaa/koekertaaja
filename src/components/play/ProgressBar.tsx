interface ProgressBarProps {
  current: number;
  total: number;
  mode?: 'quiz' | 'flashcard';
  variant?: 'default' | 'header';
}

export function ProgressBar({ current, total, mode = 'quiz', variant = 'default' }: ProgressBarProps) {
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
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white/30 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <span className="text-sm text-indigo-100 font-medium whitespace-nowrap">
          {progressRounded}% valmis
        </span>
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
          {progressRounded}% valmis
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
