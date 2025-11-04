-- Create question_sets table
CREATE TABLE IF NOT EXISTS question_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade INTEGER,
  difficulty VARCHAR(20) NOT NULL,
  topic TEXT,
  subtopic TEXT,
  question_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  correct_answer JSONB NOT NULL,
  options JSONB,
  explanation TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_sets_code ON question_sets(code);
CREATE INDEX IF NOT EXISTS idx_question_sets_subject ON question_sets(subject);
CREATE INDEX IF NOT EXISTS idx_question_sets_created_at ON question_sets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(question_set_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(question_set_id, order_index);

-- Enable Row Level Security
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Enable read access for all users" ON question_sets
  FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON questions
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_question_sets_updated_at
  BEFORE UPDATE ON question_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
