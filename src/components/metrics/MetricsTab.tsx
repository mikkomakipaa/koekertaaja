'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsSummaryCards } from './MetricsSummaryCards';
import { SuccessRateChart } from './SuccessRateChart';
import { ProviderTable } from './ProviderTable';
import { RecentFailures } from './RecentFailures';
import { PromptVersionTable } from './PromptVersionTable';
import type { PromptMetricsDashboardData } from './types';

type TimeRange = '7d' | '30d' | '90d';

const EMPTY_DATA: PromptMetricsDashboardData = {
  summary: {
    totalSessions: 0,
    sessionsTrendPercent: 0,
    avgSuccessRate: 0,
    avgLatencyMs: 0,
    totalCostUsd: 0,
  },
  timeSeries: [],
  byProvider: [],
  recentFailures: [],
  byPromptVersion: [],
};

export function MetricsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PromptMetricsDashboardData>(EMPTY_DATA);

  const loadMetrics = async (range: TimeRange) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/prompt-metrics/dashboard?timeRange=${range}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Metriikoiden lataus epäonnistui');
      }
      setData(payload as PromptMetricsDashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Metriikoiden lataus epäonnistui');
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics(timeRange);
  }, [timeRange]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompt-metriikat</h3>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              mode="neutral"
              variant={timeRange === range ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-6">
          <MetricsSummaryCards summary={data.summary} />
          <SuccessRateChart data={data.timeSeries} />
          <ProviderTable rows={data.byProvider} />
          <PromptVersionTable rows={data.byPromptVersion} />
          <RecentFailures failures={data.recentFailures} />
        </div>
      )}
    </div>
  );
}
