'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PromptVersionPerformanceRow } from '@/lib/metrics/promptMetrics';

interface PromptVersionTableProps {
  rows: PromptVersionPerformanceRow[];
}

export function PromptVersionTable({ rows }: PromptVersionTableProps) {
  const best = [...rows].sort((a, b) => b.avgSuccessRate - a.avgSuccessRate)[0];

  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <CardTitle className="text-base">Prompt-versioiden suorituskyky</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="py-2 pr-3">Versio</th>
                <th className="py-2 pr-3">Ajot</th>
                <th className="py-2 pr-3">Onnistuminen</th>
                <th className="py-2 pr-3">Adoptio</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.version} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3 break-all">{row.version}</td>
                  <td className="py-2 pr-3">{row.sessions}</td>
                  <td className="py-2 pr-3">{row.avgSuccessRate.toFixed(1)}%</td>
                  <td className="py-2 pr-3">{row.adoptionRate.toFixed(1)}%</td>
                  <td className="py-2 pr-3 flex items-center gap-2">
                    {best && best.version === row.version && (
                      <Badge variant="default" semantic="success">Paras</Badge>
                    )}
                    {row.breakingChange && (
                      <Badge variant="default" semantic="warning">Breaking</Badge>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-gray-500 dark:text-gray-400">
                    Ei prompt-versiodataa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
