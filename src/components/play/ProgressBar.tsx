interface ProgressBarProps {
  current: number;
  total: number;
  score: number;
}

export function ProgressBar({ current, total, score }: ProgressBarProps) {
  const progress = (current / total) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
        <span>
          Kysymys {current} / {total}
        </span>
        <span>
          Pisteet: {score} / {current}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
