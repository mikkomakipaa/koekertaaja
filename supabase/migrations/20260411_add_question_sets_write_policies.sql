-- Restrict authenticated writes on question_sets to the owning user.
-- Service role continues to bypass RLS for server-side admin/API writes.

-- Remove the earlier broad write policies before replacing them with
-- owner-scoped authenticated policies.
DROP POLICY IF EXISTS "Enable insert for service role" ON public.question_sets;
DROP POLICY IF EXISTS "Enable update for service role" ON public.question_sets;

-- Authenticated users may only create rows owned by themselves.
CREATE POLICY "Enable insert for question_sets owners" ON public.question_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users may only update rows they own and must preserve ownership.
CREATE POLICY "Enable update for question_sets owners" ON public.question_sets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Keep explicit service-role policies for clarity even though service role
-- bypasses RLS by default.
CREATE POLICY "Enable insert for service role on question_sets" ON public.question_sets
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Enable update for service role on question_sets" ON public.question_sets
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- DELETE policy already exists in 20250130_add_delete_policies.sql.
