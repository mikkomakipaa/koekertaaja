'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SubjectPerformanceRow } from '@/lib/metrics/promptMetrics';

interface SubjectTableProps {
  rows?: SubjectPerformanceRow[];
}

function modeLabel(mode: string): string {
  if (mode === 'flashcard') return 'Kortit';
  if (mode === 'quiz') return 'Koe';
  return mode;
}

export function SubjectTable({ rows = [] }: SubjectTableProps) {
  if (rows.length === 0) {
    return (
      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Ainekohtainen näkymä</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-500 dark:text-gray-400">
          Ei ainekohtaista metriikkadataa.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <CardTitle className="text-base">Ainekohtainen näkymä</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs text-gray-500 dark:text-gray-400">
                <th className="py-2 pr-3 font-medium">Aine</th>
                <th className="py-2 pr-3 font-medium">Tila</th>
                <th className="py-2 pr-3 font-medium">Ajot</th>
                <th className="py-2 pr-3 font-medium">Validointi ↑</th>
                <th className="py-2 pr-3 font-medium">Virheaste ↓</th>
                <th className="py-2 pr-3 font-medium">Viive ↓</th>
                <th className="py-2 pr-3 font-medium">Keskim. hinta ↓</th>
                <th className="py-2 pr-3 font-medium">€/validikys. ↓</th>
                <th className="py-2 pr-3 font-medium">Viimeksi käytetty</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.subject}::${row.mode}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/40">
                  <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">{row.subject}</td>
                  <td className="py-2 pr-3">
                    <Badge size="sm">{modeLabel(row.mode)}</Badge>
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
                  <td className="py-2 pr-3 text-xs text-gray-400 dark:text-gray-500">
                    {row.lastUsed ? new Date(row.lastUsed).toLocaleDateString('fi-FI') : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
