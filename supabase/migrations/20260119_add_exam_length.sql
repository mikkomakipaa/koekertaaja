-- Add exam_length to question_sets to store session length per set
ALTER TABLE question_sets
ADD COLUMN IF NOT EXISTS exam_length INTEGER NOT NULL DEFAULT 15;

COMMENT ON COLUMN question_sets.exam_length IS 'Questions per session for this set (used in play sessions).';
