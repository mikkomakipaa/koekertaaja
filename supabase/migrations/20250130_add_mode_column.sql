-- Add mode column to question_sets table to distinguish quiz sets from flashcard sets
-- This enables better filtering and future flashcard-specific features (e.g., spaced repetition)

-- Add mode column with default 'quiz'
ALTER TABLE question_sets
ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'quiz' CHECK (mode IN ('quiz', 'flashcard'));

-- Create index for mode filtering
CREATE INDEX IF NOT EXISTS idx_question_sets_mode ON question_sets(mode);

-- Update existing flashcard sets (identified by naming convention "- Kortit")
-- This is a one-time migration for existing data
UPDATE question_sets
SET mode = 'flashcard'
WHERE name LIKE '% - Kortit';

-- Add comment for documentation
COMMENT ON COLUMN question_sets.mode IS 'Quiz mode: traditional assessment with difficulty levels. Flashcard mode: memorization-focused with active recall optimization.';
