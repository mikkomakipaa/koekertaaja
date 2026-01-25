interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
  mode?: 'quiz' | 'flashcard';
}

export function ProgressBar({ current, total, score, mode = 'quiz' }: ProgressBarProps) {
  const progress = (current / total) * 100;
  const progressRounded = Math.round(progress);
  const barColor =
    mode === 'flashcard'
      ? 'bg-teal-600 dark:bg-teal-500'
      : 'bg-indigo-600 dark:bg-indigo-500';
  const labelColor =
    mode === 'flashcard'
      ? 'text-teal-600 dark:text-teal-400'
      : 'text-indigo-600 dark:text-indigo-400';

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
