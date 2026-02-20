import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  aggregateByPromptVersion,
  aggregateByProvider,
  calculateSummary,
  calculateTimeSeries,
  getRecentFailures,
} from '../../src/lib/metrics/promptMetrics';
import type { PromptMetricRow } from '../../src/types/database';

function isoDaysAgo(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

const metrics: PromptMetricRow[] = [
  {
    id: '1',
    created_at: isoDaysAgo(0),
    user_id: 'u1',
    subject: 'math',
    difficulty: 'helppo',
    mode: 'quiz',
    question_count_requested: 20,
    provider: 'anthropic',
    model: 'claude-sonnet-4-6-20250514',
    prompt_version: { 'core/format': '2.0.0' },
    question_count_generated: 20,
    question_count_valid: 20,
    generation_latency_ms: 3000,
    input_tokens: 1000,
    output_tokens: 1200,
    estimated_cost_usd: 0.01,
    validation_pass_rate: 100,
    skill_coverage: 100,
    topic_coverage: 100,
    type_variety_score: 20,
    had_errors: false,
    error_summary: null,
    retry_count: 0,
    question_set_id: null,
  },
  {
    id: '2',
    created_at: isoDaysAgo(1),
    user_id: 'u1',
    subject: 'english',
    difficulty: 'normaali',
    mode: 'quiz',
    question_count_requested: 20,
    provider: 'openai',
    model: 'gpt-5-mini',
    prompt_version: { 'core/format': '1.0.0' },
    question_count_generated: 20,
    question_count_valid: 15,
    generation_latency_ms: 5000,
    input_tokens: 1000,
    output_tokens: 1200,
    estimated_cost_usd: 0.03,
    validation_pass_rate: 75,
    skill_coverage: 80,
    topic_coverage: 90,
    type_variety_score: 15,
    had_errors: true,
    error_summary: 'validation failures',
    retry_count: 1,
    question_set_id: 'q1',
  },
];

test('dashboard aggregations produce summary, provider comparison, and failures', () => {
  const summary = calculateSummary(metrics);
  assert.equal(summary.totalSessions, 2);
  assert.equal(summary.avgSuccessRate, 87.5);
  assert.equal(summary.totalCostUsd, 0.04);

  const byProvider = aggregateByProvider(metrics);
  assert.equal(byProvider.length, 2);
  assert.equal(byProvider[0].sessions, 1);
  assert.ok(byProvider.some((row) => row.provider === 'anthropic'));

  const failures = getRecentFailures(metrics);
  assert.equal(failures.length, 1);
  assert.equal(failures[0].id, '2');
});

test('dashboard time series and prompt version breakdown are generated', () => {
  const timeSeries = calculateTimeSeries(metrics, 7);
  assert.equal(timeSeries.length, 7);
  assert.ok(timeSeries.some((point) => point.sessions > 0));

  const byPromptVersion = aggregateByPromptVersion(metrics);
  assert.equal(byPromptVersion.length, 2);
  assert.ok(byPromptVersion.some((row) => row.breakingChange));
});
