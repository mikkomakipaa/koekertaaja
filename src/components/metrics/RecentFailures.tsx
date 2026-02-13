'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { RecentFailureRow } from './types';

interface RecentFailuresProps {
  failures: RecentFailureRow[];
}

export function RecentFailures({ failures }: RecentFailuresProps) {
  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <CardTitle className="text-base">Viimeisimmät virheet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {failures.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Ei virheitä valitulla aikavälillä.</p>
        )}
        {failures.map((failure) => (
          <div
            key={failure.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" semantic="error">Virhe</Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(failure.created_at).toLocaleString('fi-FI')}
              </span>
            </div>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {failure.subject} / {failure.difficulty}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {failure.error_summary || 'Tuntematon virhe'}
            </p>
            {failure.questionSetCode && (
              <Link className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" href={`/play/${failure.questionSetCode}`}>
                Avaa kysymyssarja
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
