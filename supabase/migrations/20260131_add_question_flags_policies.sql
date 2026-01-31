-- Add explicit RLS policies for question_flags

-- Allow anonymous flag submission (INSERT)
DROP POLICY IF EXISTS "Enable insert for all users" ON question_flags;
CREATE POLICY "Enable insert for all users" ON question_flags
  FOR INSERT WITH CHECK (true);

-- Deny public read access (SELECT)
DROP POLICY IF EXISTS "Deny read access for all users" ON question_flags;
CREATE POLICY "Deny read access for all users" ON question_flags
  FOR SELECT USING (false);

-- Deny public delete access (DELETE)
DROP POLICY IF EXISTS "Deny delete access for all users" ON question_flags;
CREATE POLICY "Deny delete access for all users" ON question_flags
  FOR DELETE USING (false);
