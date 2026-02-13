CREATE TABLE IF NOT EXISTS prompt_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),

  -- Generation metadata
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'flashcard')),
  question_count_requested INTEGER NOT NULL,

  -- AI metadata
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version JSONB,

  -- Performance metrics
  question_count_generated INTEGER NOT NULL,
  question_count_valid INTEGER NOT NULL,
  generation_latency_ms INTEGER NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd DECIMAL(10,4),

  -- Quality metrics
  validation_pass_rate DECIMAL(5,2),
  skill_coverage DECIMAL(5,2),
  topic_coverage DECIMAL(5,2),
  type_variety_score DECIMAL(5,2),

  -- Error tracking
  had_errors BOOLEAN NOT NULL DEFAULT false,
  error_summary TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  question_set_id UUID REFERENCES question_sets(id)
);

CREATE INDEX IF NOT EXISTS idx_prompt_metrics_created_at
  ON prompt_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_user_id
  ON prompt_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_provider
  ON prompt_metrics(provider, model);
CREATE INDEX IF NOT EXISTS idx_prompt_metrics_had_errors
  ON prompt_metrics(had_errors)
  WHERE had_errors = true;

ALTER TABLE prompt_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metrics" ON prompt_metrics;
CREATE POLICY "Users can view own metrics"
  ON prompt_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all metrics" ON prompt_metrics;
CREATE POLICY "Admins can view all metrics"
  ON prompt_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service can insert metrics" ON prompt_metrics;
CREATE POLICY "Service can insert metrics"
  ON prompt_metrics
  FOR INSERT
  WITH CHECK (true);
