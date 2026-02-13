import type {
  PromptMetricsSummary,
  PromptMetricsTimeSeriesPoint,
  ProviderPerformanceRow,
  PromptVersionPerformanceRow,
} from '@/lib/metrics/promptMetrics';
import type { PromptMetricRow } from '@/types/database';

export interface RecentFailureRow extends PromptMetricRow {
  questionSetCode?: string | null;
}

export interface PromptMetricsDashboardData {
  summary: PromptMetricsSummary;
  timeSeries: PromptMetricsTimeSeriesPoint[];
  byProvider: ProviderPerformanceRow[];
  recentFailures: RecentFailureRow[];
  byPromptVersion: PromptVersionPerformanceRow[];
}
