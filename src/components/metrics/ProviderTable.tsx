'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProviderPerformanceRow } from '@/lib/metrics/promptMetrics';

interface ProviderTableProps {
  rows?: ProviderPerformanceRow[];
}

function findBest<T>(rows: T[], compareFn: (a: T, b: T) => number): T | undefined {
  if (rows.length === 0) return undefined;
  return [...rows].sort(compareFn)[0];
}

export function ProviderTable({ rows = [] }: ProviderTableProps) {
  if (rows.length === 0) {
    return (
      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Mallien vertailu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 dark:text-gray-400">
          Ei mittaridataa.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...rows].sort((a, b) => b.sessions - a.sessions);

  // Find best in each dimension (minimum sessions threshold: 2)
  const eligible = rows.filter((r) => r.sessions >= 2);
  const bestQuality = findBest(eligible, (a, b) => b.avgSuccessRate - a.avgSuccessRate);
  const bestSpeed = findBest(eligible, (a, b) => a.avgLatencyMs - b.avgLatencyMs);
  const bestValue = findBest(eligible.filter((r) => r.costPerValidQuestion > 0), (a, b) => a.costPerValidQuestion - b.costPerValidQuestion);

  const key = (r: ProviderPerformanceRow) => `${r.provider}::${r.model}`;

  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Mallien vertailu</CardTitle>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="flex items-center gap-1">
              <Badge variant="default" semantic="success">Laatu</Badge>
              <span className="text-gray-500 dark:text-gray-400">= korkein validointiläpäisy</span>
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="default" semantic="info">Nopeus</Badge>
              <span className="text-gray-500 dark:text-gray-400">= lyhin viive</span>
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="default" semantic="warning">Arvo</Badge>
              <span className="text-gray-500 dark:text-gray-400">= edullisin / validikysymys</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-3 font-medium">Malli</th>
                <th className="py-2 pr-3 font-medium">Ajot</th>
                <th className="py-2 pr-3 font-medium">Validointi ↑</th>
                <th className="py-2 pr-3 font-medium">Virheaste ↓</th>
                <th className="py-2 pr-3 font-medium">Viive ↓</th>
                <th className="py-2 pr-3 font-medium">Keskim. hinta ↓</th>
                <th className="py-2 pr-3 font-medium">€/validikys. ↓</th>
                <th className="py-2 pr-3 font-medium">Tokenit (in/out)</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => {
                const k = key(row);
                const isQuality = bestQuality && key(bestQuality) === k;
                const isSpeed = bestSpeed && key(bestSpeed) === k;
                const isValue = bestValue && key(bestValue) === k;

                return (
                  <tr key={k} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                    <td className="py-2 pr-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{row.model}</span>
                        <span className="text-xs text-gray-400">{row.provider}</span>
                        <div className="flex flex-wrap gap-1">
                          {isQuality && <Badge variant="default" semantic="success">Laatu</Badge>}
                          {isSpeed && <Badge variant="default" semantic="info">Nopeus</Badge>}
                          {isValue && <Badge variant="default" semantic="warning">Arvo</Badge>}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 pr-3">{row.sessions}</td>
                    <td className="py-2 pr-3">
                      <span className={row.avgSuccessRate < 90 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {row.avgSuccessRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className={row.errorRate > 10 ? 'text-rose-600 dark:text-rose-400' : row.errorRate > 3 ? 'text-amber-600 dark:text-amber-400' : ''}>
                        {row.errorRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 pr-3">{(row.avgLatencyMs / 1000).toFixed(1)}s</td>
                    <td className="py-2 pr-3">€{row.avgCostUsd.toFixed(4)}</td>
                    <td className="py-2 pr-3">€{row.costPerValidQuestion.toFixed(5)}</td>
                    <td className="py-2 pr-3 text-xs text-gray-500 dark:text-gray-400">
                      {row.avgInputTokens > 0 || row.avgOutputTokens > 0
                        ? `${row.avgInputTokens.toLocaleString('fi-FI')} / ${row.avgOutputTokens.toLocaleString('fi-FI')}`
                        : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          Parhaat merkit myönnetään malleille, joilla on vähintään 2 ajoa. Validointi = osuus hyväksytyistä kysymyksistä kaikista generoiduista.
        </p>
      </CardContent>
    </Card>
  );
}
