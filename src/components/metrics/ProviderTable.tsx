'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProviderPerformanceRow } from '@/lib/metrics/promptMetrics';

interface ProviderTableProps {
  rows: ProviderPerformanceRow[];
}

export function ProviderTable({ rows }: ProviderTableProps) {
  const sorted = [...rows].sort((a, b) => b.sessions - a.sessions);
  const best = [...rows].sort((a, b) => {
    if (b.avgSuccessRate !== a.avgSuccessRate) {
      return b.avgSuccessRate - a.avgSuccessRate;
    }
    return a.avgLatencyMs - b.avgLatencyMs;
  })[0];

  return (
    <Card variant="elevated" padding="standard">
      <CardHeader>
        <CardTitle className="text-base">Mallien vertailu</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="py-2 pr-3">Provider</th>
                <th className="py-2 pr-3">Malli</th>
                <th className="py-2 pr-3">Ajot</th>
                <th className="py-2 pr-3">Onnistuminen</th>
                <th className="py-2 pr-3">Viive</th>
                <th className="py-2 pr-3">Keskikust.</th>
                <th className="py-2 pr-3">$/validi</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={`${row.provider}-${row.model}`} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-2 pr-3">{row.provider}</td>
                  <td className="py-2 pr-3 flex items-center gap-2">
                    <span>{row.model}</span>
                    {best && best.provider === row.provider && best.model === row.model && (
                      <Badge variant="default" semantic="success">Paras</Badge>
                    )}
                  </td>
                  <td className="py-2 pr-3">{row.sessions}</td>
                  <td className="py-2 pr-3">{row.avgSuccessRate.toFixed(1)}%</td>
                  <td className="py-2 pr-3">{(row.avgLatencyMs / 1000).toFixed(2)}s</td>
                  <td className="py-2 pr-3">${row.avgCostUsd.toFixed(4)}</td>
                  <td className="py-2 pr-3">${row.costPerValidQuestion.toFixed(4)}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-gray-500 dark:text-gray-400">
                    Ei mittaridataa.
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
