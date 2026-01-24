-- Create map_questions table
CREATE TABLE IF NOT EXISTS map_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE SET NULL,
  subject TEXT NOT NULL DEFAULT 'Maantieto',
  grade SMALLINT,
  difficulty TEXT,
  question TEXT NOT NULL,
  explanation TEXT NOT NULL,
  topic TEXT,
  subtopic TEXT,
  skill TEXT,
  map_asset TEXT NOT NULL,
  input_mode TEXT NOT NULL,
  regions JSONB NOT NULL,
  correct_answer JSONB NOT NULL,
  acceptable_answers TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for map_questions
CREATE INDEX IF NOT EXISTS idx_map_questions_question_set_id ON map_questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_map_questions_subject ON map_questions(subject);
CREATE INDEX IF NOT EXISTS idx_map_questions_created_at ON map_questions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE map_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON map_questions
  FOR SELECT USING (true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_map_questions_updated_at
  BEFORE UPDATE ON map_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
