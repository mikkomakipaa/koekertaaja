-- Create question_flags table for anonymous question flagging

-- Create enum type for flag reason
DO $$ BEGIN
  CREATE TYPE question_flag_reason AS ENUM ('wrong_answer', 'ambiguous', 'typo', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS question_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE NOT NULL,
  reason question_flag_reason NOT NULL,
  note TEXT,
  client_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for lookup and rate-limiting queries
CREATE INDEX IF NOT EXISTS idx_question_flags_question_id ON question_flags(question_id);
CREATE INDEX IF NOT EXISTS idx_question_flags_question_set_id ON question_flags(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_flags_client_id_created_at
  ON question_flags(client_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE question_flags ENABLE ROW LEVEL SECURITY;
