'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProblematicRunRow } from './types';

interface RecentFailuresProps {
  failures: ProblematicRunRow[];
}

export function RecentFailures({ failures }: RecentFailuresProps) {
  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Ongelmalliset ajot</CardTitle>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Kovat virheet + alhainen validointiläpäisy (&lt;80%)
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {failures.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Ei ongelmallisia ajoja valitulla aikavälillä.</p>
        )}
        {failures.map((run) => (
          <div
            key={run.id}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              {run.isHardError && <Badge variant="default" semantic="error">Virhe</Badge>}
              {run.isLowQuality && <Badge variant="default" semantic="warning">Heikko laatu</Badge>}
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(run.created_at).toLocaleString('fi-FI')}
              </span>
              {run.provider && run.model && (
                <span className="text-xs font-mono text-gray-400 dark:text-gray-500">
                  {run.provider} / {run.model}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-gray-900 dark:text-gray-100">
                {run.subject} / {run.difficulty}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                Validointi: <strong className={Number(run.validation_pass_rate ?? 0) < 90 ? 'text-amber-600 dark:text-amber-400' : ''}>
                  {Number(run.validation_pass_rate ?? 0).toFixed(1)}%
                </strong>
              </span>
              {Number(run.retry_count ?? 0) > 0 && (
                <span className="text-gray-400">Uudelleenyritykset: {run.retry_count}</span>
              )}
            </div>
            {run.isHardError && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {run.error_summary || 'Tuntematon virhe'}
              </p>
            )}
            {run.questionSetCode && (
              <Link className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline" href={`/play/${run.questionSetCode}`}>
                Avaa kysymyssarja
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
