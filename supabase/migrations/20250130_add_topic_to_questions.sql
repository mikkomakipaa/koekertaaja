-- Add topic column to questions table for topic-based stratified sampling
-- This enables balanced question distribution across topics in test sessions

-- Add topic column (nullable for gradual migration)
ALTER TABLE questions
ADD COLUMN topic TEXT NULL;

-- Create index for efficient topic-based filtering
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);

-- Create index for topic + question_set_id (common query pattern)
CREATE INDEX IF NOT EXISTS idx_questions_set_topic ON questions(question_set_id, topic);

-- Add comment for documentation
COMMENT ON COLUMN questions.topic IS 'High-level topic tag (e.g., Grammar, Vocabulary, Reading). Used for stratified sampling to ensure balanced test coverage across topics.';

-- Note: Existing questions will have NULL topics
-- New questions generated after this migration will have topics assigned by AI
-- Topics are identified automatically during question generation
