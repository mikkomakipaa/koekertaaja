'use client';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  message: string;
  accent?: 'indigo' | 'teal';
  className?: string;
}

export function LoadingScreen({ message, accent = 'indigo', className }: LoadingScreenProps) {
  const accentClass =
    accent === 'teal'
      ? 'border-teal-600 dark:border-teal-400'
      : 'border-indigo-600 dark:border-indigo-400';

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors',
        className
      )}
    >
      <div className="text-center">
        <div className={cn('w-12 h-12 mx-auto mb-4 animate-spin rounded-full border-4 border-t-transparent', accentClass)} />
        <p className="text-lg text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
