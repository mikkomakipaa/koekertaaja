CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE NOT NULL,
  anthropic_key_secret_id UUID,
  openai_key_secret_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_settings_member_read" ON public.school_settings
  FOR SELECT
  USING (
    school_id IN (
      SELECT school_members.school_id
      FROM public.school_members
      WHERE school_members.user_id = auth.uid()
    )
  );

CREATE POLICY "school_settings_service_write" ON public.school_settings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
