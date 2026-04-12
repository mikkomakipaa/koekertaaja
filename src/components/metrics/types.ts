import type {
  PromptMetricsSummary,
  PromptMetricsTimeSeriesPoint,
  ProviderPerformanceRow,
  SubjectPerformanceRow,
} from '@/lib/metrics/promptMetrics';
import type { PromptMetricRow } from '@/types/database';

export interface ProblematicRunRow extends PromptMetricRow {
  questionSetCode?: string | null;
  isHardError: boolean;
  isLowQuality: boolean;
}

// Kept for backwards compatibility alias
export type RecentFailureRow = ProblematicRunRow;

export interface PromptMetricsCreatorOption {
  id: string;
  label: string;
  sessionCount: number;
}

export interface PromptMetricsDashboardData {
  summary: PromptMetricsSummary;
  timeSeries: PromptMetricsTimeSeriesPoint[];
  byProvider: ProviderPerformanceRow[];
  recentFailures: ProblematicRunRow[];
  bySubject: SubjectPerformanceRow[];
  creators: PromptMetricsCreatorOption[];
  selectedCreatedBy: string;
  canFilterByCreator: boolean;
}
