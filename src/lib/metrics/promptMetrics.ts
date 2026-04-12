import type { PromptMetricRow } from '@/types/database';

export interface PromptMetricsSummary {
  totalSessions: number;
  sessionsTrendPercent: number;
  avgSuccessRate: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  errorRate: number;
  costPerValidQuestion: number;
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
  errorRate: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

export interface SubjectPerformanceRow {
  subject: string;
  mode: 'quiz' | 'flashcard' | string;
  sessions: number;
  avgSuccessRate: number;
  avgCostUsd: number;
  avgLatencyMs: number;
  costPerValidQuestion: number;
  errorRate: number;
  lastUsed: string;
}

export interface ProblematicRunRow extends PromptMetricRow {
  questionSetCode?: string | null;
  isHardError: boolean;
  isLowQuality: boolean;
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

  const totalCostUsd = Number(
    metrics.reduce((sum, metric) => sum + Number(metric.estimated_cost_usd ?? 0), 0).toFixed(4)
  );
  const totalValid = metrics.reduce((sum, m) => sum + Number(m.question_count_valid ?? 0), 0);
  const errorCount = metrics.filter((m) => m.had_errors).length;

  return {
    totalSessions,
    sessionsTrendPercent,
    avgSuccessRate: average(metrics.map((m) => Number(m.validation_pass_rate ?? 0))),
    avgLatencyMs: average(metrics.map((m) => Number(m.generation_latency_ms ?? 0))),
    totalCostUsd,
    errorRate: totalSessions > 0 ? Number(((errorCount / totalSessions) * 100).toFixed(1)) : 0,
    costPerValidQuestion: totalValid > 0 ? Number((totalCostUsd / totalValid).toFixed(5)) : 0,
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
      const errorCount = rows.filter((row) => row.had_errors).length;

      return {
        provider,
        model,
        sessions: rows.length,
        avgSuccessRate: average(rows.map((row) => Number(row.validation_pass_rate ?? 0))),
        avgLatencyMs: average(rows.map((row) => Number(row.generation_latency_ms ?? 0))),
        avgCostUsd: average(rows.map((row) => Number(row.estimated_cost_usd ?? 0))),
        costPerValidQuestion: totalValid > 0 ? Number((totalCost / totalValid).toFixed(5)) : 0,
        errorRate: rows.length > 0 ? Number(((errorCount / rows.length) * 100).toFixed(1)) : 0,
        avgInputTokens: Math.round(average(rows.map((row) => Number(row.input_tokens ?? 0)))),
        avgOutputTokens: Math.round(average(rows.map((row) => Number(row.output_tokens ?? 0)))),
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

// Returns hard errors AND low-quality runs (validation pass rate < 80%) as problematic
export function getProblematicRuns(metrics: PromptMetricRow[]): Array<PromptMetricRow & { isHardError: boolean; isLowQuality: boolean }> {
  const LOW_QUALITY_THRESHOLD = 80;
  return metrics
    .filter((m) => m.had_errors || Number(m.validation_pass_rate ?? 100) < LOW_QUALITY_THRESHOLD)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map((m) => ({
      ...m,
      isHardError: Boolean(m.had_errors),
      isLowQuality: !m.had_errors && Number(m.validation_pass_rate ?? 100) < LOW_QUALITY_THRESHOLD,
    }));
}

export function aggregateBySubject(metrics: PromptMetricRow[]): SubjectPerformanceRow[] {
  const grouped = new Map<string, PromptMetricRow[]>();

  for (const metric of metrics) {
    const subject = String(metric.subject ?? 'Tuntematon');
    const mode = String(metric.mode ?? 'quiz');
    const key = `${subject}::${mode}`;
    const rows = grouped.get(key) ?? [];
    rows.push(metric);
    grouped.set(key, rows);
  }

  return Array.from(grouped.entries())
    .map(([key, rows]) => {
      const [subject, mode] = key.split('::');
      const sorted = [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const errorCount = rows.filter((r) => r.had_errors).length;
      const totalValid = rows.reduce((sum, row) => sum + Number(row.question_count_valid ?? 0), 0);
      const totalCost = rows.reduce((sum, row) => sum + Number(row.estimated_cost_usd ?? 0), 0);

      return {
        subject,
        mode,
        sessions: rows.length,
        avgSuccessRate: average(rows.map((row) => Number(row.validation_pass_rate ?? 0))),
        avgCostUsd: average(rows.map((row) => Number(row.estimated_cost_usd ?? 0))),
        avgLatencyMs: average(rows.map((row) => Number(row.generation_latency_ms ?? 0))),
        costPerValidQuestion: totalValid > 0 ? Number((totalCost / totalValid).toFixed(5)) : 0,
        errorRate: rows.length > 0 ? Number(((errorCount / rows.length) * 100).toFixed(1)) : 0,
        lastUsed: sorted[0]?.created_at ?? '',
      };
    })
    .sort((a, b) => b.sessions - a.sessions || new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Number((sum / values.length).toFixed(2));
}
