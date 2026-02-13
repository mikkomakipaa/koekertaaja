'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PromptMetricsSummary } from '@/lib/metrics/promptMetrics';

interface MetricsSummaryCardsProps {
  summary: PromptMetricsSummary;
}

function formatTrend(value: number): string {
  if (value > 0) return `+${value.toFixed(1)}%`;
  return `${value.toFixed(1)}%`;
}

export function MetricsSummaryCards({ summary }: MetricsSummaryCardsProps) {
  const avgLatencySec = (summary.avgLatencyMs / 1000).toFixed(2);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Kokonaisajot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{summary.totalSessions}</p>
          <Badge
            variant="default"
            semantic={summary.sessionsTrendPercent >= 0 ? 'success' : 'warning'}
          >
            {formatTrend(summary.sessionsTrendPercent)}
          </Badge>
        </CardContent>
      </Card>

      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Keskimääräinen onnistuminen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {summary.avgSuccessRate.toFixed(1)}%
          </p>
          <Badge
            variant="default"
            semantic={summary.avgSuccessRate < 90 ? 'warning' : 'success'}
          >
            {summary.avgSuccessRate < 90 ? 'Alle 90%' : 'Hyvä taso'}
          </Badge>
        </CardContent>
      </Card>

      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Keskimääräinen viive</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{avgLatencySec}s</p>
        </CardContent>
      </Card>

      <Card variant="elevated" padding="standard">
        <CardHeader>
          <CardTitle className="text-base">Kokonaiskustannus</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ${summary.totalCostUsd.toFixed(4)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
