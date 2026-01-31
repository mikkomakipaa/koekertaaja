-- Restrict public read access to questions from published question sets

DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable read access for published question sets" ON questions;

CREATE POLICY "Enable read access for published question sets" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM question_sets
      WHERE question_sets.id = questions.question_set_id
        AND question_sets.status = 'published'
    )
  );
