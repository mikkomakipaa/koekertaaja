import { createLogger } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const logger = createLogger({ module: 'promptMetricsLogger' });

export interface PromptMetricsInsert {
  user_id?: string | null;
  question_set_id?: string | null;
  subject: string;
  difficulty: string;
  mode: 'quiz' | 'flashcard';
  question_count_requested: number;
  provider: string;
  model: string;
  prompt_version?: Record<string, string> | null;
  question_count_generated: number;
  question_count_valid: number;
  generation_latency_ms: number;
  input_tokens?: number | null;
  output_tokens?: number | null;
  estimated_cost_usd: number;
  validation_pass_rate: number;
  skill_coverage: number;
  topic_coverage: number;
  type_variety_score: number;
  had_errors: boolean;
  error_summary?: string | null;
  retry_count: number;
}

interface InsertPromptMetricsDeps {
  getAdminClient?: typeof getSupabaseAdmin;
}

export async function insertPromptMetrics(
  metrics: PromptMetricsInsert,
  deps: InsertPromptMetricsDeps = {}
): Promise<void> {
  const getAdminClient = deps.getAdminClient ?? getSupabaseAdmin;
  const adminClient = getAdminClient();
  const { error } = await adminClient.from('prompt_metrics').insert(metrics as any);
  if (error) {
    throw error;
  }
}

export function logPromptMetricsFireAndForget(
  metrics: PromptMetricsInsert,
  deps: InsertPromptMetricsDeps = {}
): void {
  void insertPromptMetrics(metrics, deps).catch((error) => {
    logger.error({ error }, 'Failed to log prompt metrics');
  });
}
