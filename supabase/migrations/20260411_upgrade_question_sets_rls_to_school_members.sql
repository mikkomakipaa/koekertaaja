-- Replace the phase-1 authenticated question_sets policies with
-- school-membership-scoped INSERT and creator-scoped UPDATE/DELETE.

DROP POLICY IF EXISTS "Enable insert for question_sets owners" ON public.question_sets;
DROP POLICY IF EXISTS "Enable update for question_sets owners" ON public.question_sets;

CREATE POLICY "creator_insert" ON public.question_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    school_id IN (
      SELECT school_members.school_id
      FROM public.school_members
      WHERE school_members.user_id = auth.uid()
    )
  );

CREATE POLICY "creator_update" ON public.question_sets
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "creator_delete" ON public.question_sets
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
