-- Add DELETE policies for server-side operations
-- The service role key should bypass RLS, but explicit policies are best practice

-- Allow service role to delete question sets
CREATE POLICY IF NOT EXISTS "Enable delete for service role" ON question_sets
  FOR DELETE
  USING (true);

-- Allow service role to delete questions
CREATE POLICY IF NOT EXISTS "Enable delete for service role" ON questions
  FOR DELETE
  USING (true);

-- Also add INSERT policies for completeness (needed for question creation)
CREATE POLICY IF NOT EXISTS "Enable insert for service role" ON question_sets
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable insert for service role" ON questions
  FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policies for potential future use
CREATE POLICY IF NOT EXISTS "Enable update for service role" ON question_sets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable update for service role" ON questions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
