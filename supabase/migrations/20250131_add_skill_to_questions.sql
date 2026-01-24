ALTER TABLE questions
ADD COLUMN skill TEXT;

CREATE INDEX idx_questions_skill ON questions(skill);

COMMENT ON COLUMN questions.skill IS 'Specific skill being tested (e.g., verb_tenses, addition, cause_effect)';
