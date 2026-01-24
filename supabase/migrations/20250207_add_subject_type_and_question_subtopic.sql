ALTER TABLE question_sets
ADD COLUMN IF NOT EXISTS subject_type TEXT;

COMMENT ON COLUMN question_sets.subject_type IS 'Subject grouping for prompts/skill taxonomy (language, math, written, skills, concepts)';

CREATE INDEX IF NOT EXISTS idx_question_sets_subject_type ON question_sets(subject_type);

ALTER TABLE questions
ADD COLUMN IF NOT EXISTS subtopic TEXT;

COMMENT ON COLUMN questions.subtopic IS 'Optional finer-grained subtopic within the topic for a question';
