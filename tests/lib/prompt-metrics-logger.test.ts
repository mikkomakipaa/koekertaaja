import assert from 'node:assert/strict';
import { test } from 'node:test';
import { insertPromptMetrics, type PromptMetricsInsert } from '../../src/lib/metrics/logPromptMetrics';

const baseMetric: PromptMetricsInsert = {
  subject: 'matematiikka',
  difficulty: 'helppo',
  mode: 'quiz',
  question_count_requested: 20,
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  question_count_generated: 20,
  question_count_valid: 18,
  generation_latency_ms: 3500,
  estimated_cost_usd: 0.0123,
  validation_pass_rate: 90,
  skill_coverage: 95,
  topic_coverage: 100,
  type_variety_score: 20,
  had_errors: true,
  error_summary: '2 validation failures',
  retry_count: 0,
};

test('insertPromptMetrics inserts row to prompt_metrics table', async () => {
  let table = '';
  let inserted: PromptMetricsInsert | null = null;

  const getAdminClient = () => ({
    from: (name: string) => {
      table = name;
      return {
        insert: async (payload: PromptMetricsInsert) => {
          inserted = payload;
          return { error: null };
        },
      };
    },
  }) as any;

  await insertPromptMetrics(baseMetric, { getAdminClient });

  assert.equal(table, 'prompt_metrics');
  assert.deepEqual(inserted, baseMetric);
});

test('insertPromptMetrics throws when supabase returns error', async () => {
  const getAdminClient = () => ({
    from: () => ({
      insert: async () => ({
        error: new Error('insert failed'),
      }),
    }),
  }) as any;

  await assert.rejects(
    insertPromptMetrics(baseMetric, { getAdminClient }),
    /insert failed/
  );
});
