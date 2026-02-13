import type { PromptMetricRow } from '@/types/database';

export interface PromptMetricsSummary {
  totalSessions: number;
  sessionsTrendPercent: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

export interface PromptMetricsTimeSeriesPoint {
  date: string;
  sessions: number;
  successRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
}

export interface ProviderPerformanceRow {
  provider: string;
  model: string;
  sessions: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  costPerValidQuestion: number;
}

export interface PromptVersionPerformanceRow {
  version: string;
  sessions: number;
  avgSuccessRate: number;
  adoptionRate: number;
  breakingChange: boolean;
}

export function calculateSummary(metrics: PromptMetricRow[]): PromptMetricsSummary {
  const totalSessions = metrics.length;
  const midpoint = Math.floor(totalSessions / 2);
  const latestHalf = metrics.slice(0, midpoint);
  const previousHalf = metrics.slice(midpoint);
  const previousCount = previousHalf.length;

  const sessionsTrendPercent = previousCount > 0
    ? Number((((latestHalf.length - previousCount) / previousCount) * 100).toFixed(1))
    : 0;

  return {
    totalSessions,
    sessionsTrendPercent,
    avgSuccessRate: average(metrics.map((m) => Number(m.validation_pass_rate ?? 0))),
    avgLatencyMs: average(metrics.map((m) => Number(m.generation_latency_ms ?? 0))),
    totalCostUsd: Number(
      metrics.reduce((sum, metric) => sum + Number(metric.estimated_cost_usd ?? 0), 0).toFixed(4)
    ),
  };
}

export function calculateTimeSeries(
  metrics: PromptMetricRow[],
  daysAgo: number
): PromptMetricsTimeSeriesPoint[] {
  const byDay = new Map<string, PromptMetricRow[]>();

  for (const metric of metrics) {
    const date = metric.created_at.slice(0, 10);
    const bucket = byDay.get(date) ?? [];
    bucket.push(metric);
    byDay.set(date, bucket);
  }

  const series: PromptMetricsTimeSeriesPoint[] = [];
  const now = new Date();

  for (let dayOffset = daysAgo - 1; dayOffset >= 0; dayOffset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - dayOffset);
    const dateKey = date.toISOString().slice(0, 10);
    const dayMetrics = byDay.get(dateKey) ?? [];

    series.push({
      date: dateKey,
      sessions: dayMetrics.length,
      successRate: average(dayMetrics.map((m) => Number(m.validation_pass_rate ?? 0))),
      avgLatencyMs: average(dayMetrics.map((m) => Number(m.generation_latency_ms ?? 0))),
      totalCostUsd: Number(
        dayMetrics.reduce((sum, metric) => sum + Number(metric.estimated_cost_usd ?? 0), 0).toFixed(4)
      ),
    });
  }

  return series;
}

export function aggregateByProvider(metrics: PromptMetricRow[]): ProviderPerformanceRow[] {
  const grouped = new Map<string, PromptMetricRow[]>();

  for (const metric of metrics) {
    const key = `${metric.provider}::${metric.model}`;
    const rows = grouped.get(key) ?? [];
    rows.push(metric);
    grouped.set(key, rows);
  }

  return Array.from(grouped.entries())
    .map(([key, rows]) => {
      const [provider, model] = key.split('::');
      const totalValid = rows.reduce((sum, row) => sum + Number(row.question_count_valid ?? 0), 0);
      const totalCost = rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);

      return {
        provider,
        model,
        sessions: rows.length,
        avgSuccessRate: average(rows.map((row) => Number(row.validation_pass_rate ?? 0))),
        avgLatencyMs: average(rows.map((row) => Number(row.generation_latency_ms ?? 0))),
        avgCostUsd: average(rows.map((row) => Number(row.estimated_cost_usd ?? 0))),
        costPerValidQuestion: totalValid > 0 ? Number((totalCost / totalValid).toFixed(4)) : 0,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);
}

export function getRecentFailures(metrics: PromptMetricRow[]): PromptMetricRow[] {
  return metrics
    .filter((metric) => metric.had_errors)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
}

export function aggregateByPromptVersion(metrics: PromptMetricRow[]): PromptVersionPerformanceRow[] {
  const grouped = new Map<string, PromptMetricRow[]>();
  const total = metrics.length || 1;

  for (const metric of metrics) {
    const version = formatPromptVersion(metric.prompt_version as Record<string, string> | null | undefined);
    const rows = grouped.get(version) ?? [];
    rows.push(metric);
    grouped.set(version, rows);
  }

  return Array.from(grouped.entries())
    .map(([version, rows]) => ({
      version,
      sessions: rows.length,
      avgSuccessRate: average(rows.map((row) => Number(row.validation_pass_rate ?? 0))),
      adoptionRate: Number(((rows.length / total) * 100).toFixed(1)),
      breakingChange: detectBreakingChange(version),
    }))
    .sort((a, b) => b.sessions - a.sessions);
}

function formatPromptVersion(value: Record<string, string> | null | undefined): string {
  if (!value || Object.keys(value).length === 0) {
    return 'Tuntematon';
  }

  return Object.entries(value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, version]) => `${key}:${version}`)
    .join(' | ');
}

function detectBreakingChange(versionLabel: string): boolean {
  const semverMatches = versionLabel.match(/\b(\d+)\.(\d+)\.(\d+)\b/g);
  if (!semverMatches) {
    return false;
  }

  return semverMatches.some((version) => {
    const major = Number(version.split('.')[0]);
    return major >= 2;
  });
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
}
