'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricsSummaryCards } from './MetricsSummaryCards';
import { SuccessRateChart } from './SuccessRateChart';
import { ProviderTable } from './ProviderTable';
import { RecentFailures } from './RecentFailures';
import { SubjectTable } from './SubjectTable';
import type { PromptMetricsDashboardData } from './types';

type TimeRange = '7d' | '30d' | '90d';

const EMPTY_DATA: PromptMetricsDashboardData = {
  summary: {
    totalSessions: 0,
    sessionsTrendPercent: 0,
    avgSuccessRate: 0,
    avgLatencyMs: 0,
    totalCostUsd: 0,
    errorRate: 0,
    costPerValidQuestion: 0,
  },
  timeSeries: [],
  byProvider: [],
  recentFailures: [],
  bySubject: [],
  creators: [],
  selectedCreatedBy: 'all',
  canFilterByCreator: false,
};

function normalizeDashboardData(payload: unknown): PromptMetricsDashboardData {
  if (!payload || typeof payload !== 'object') {
    return EMPTY_DATA;
  }

  const candidate = payload as Partial<PromptMetricsDashboardData>;

  return {
    summary: candidate.summary ?? EMPTY_DATA.summary,
    timeSeries: Array.isArray(candidate.timeSeries) ? candidate.timeSeries : [],
    byProvider: Array.isArray(candidate.byProvider) ? candidate.byProvider : [],
    recentFailures: Array.isArray(candidate.recentFailures) ? candidate.recentFailures : [],
    bySubject: Array.isArray(candidate.bySubject) ? candidate.bySubject : [],
    creators: Array.isArray(candidate.creators) ? candidate.creators : [],
    selectedCreatedBy:
      typeof candidate.selectedCreatedBy === 'string' ? candidate.selectedCreatedBy : 'all',
    canFilterByCreator: Boolean(candidate.canFilterByCreator),
  };
}

export function MetricsTab() {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [createdBy, setCreatedBy] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<PromptMetricsDashboardData>(EMPTY_DATA);

  const loadMetrics = async (range: TimeRange, creatorId: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ timeRange: range });
      if (creatorId !== 'all') {
        params.set('createdBy', creatorId);
      }

      const response = await fetch(`/api/prompt-metrics/dashboard?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Metriikoiden lataus epäonnistui');
      }
      setData(normalizeDashboardData(payload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Metriikoiden lataus epäonnistui');
      setData(EMPTY_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics(timeRange, createdBy);
  }, [timeRange, createdBy]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompt-metriikat</h3>
        <div className="flex flex-wrap items-center gap-2">
          {data.canFilterByCreator ? (
            <select
              value={createdBy}
              onChange={(event) => setCreatedBy(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              aria-label="Suodata prompt-metriikat tekijän mukaan"
            >
              <option value="all">Kaikki tekijät</option>
              {data.creators.map((creator) => (
                <option key={creator.id} value={creator.id}>
                  {creator.label} ({creator.sessionCount})
                </option>
              ))}
            </select>
          ) : null}
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
          <SubjectTable rows={data.bySubject} />
          <RecentFailures failures={data.recentFailures} />
        </div>
      )}
    </div>
  );
}
