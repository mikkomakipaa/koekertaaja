CREATE TABLE public.school_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "school_members_self_read" ON public.school_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "school_members_service_write" ON public.school_members
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "classes_public_read" ON public.classes
  FOR SELECT
  USING (true);

CREATE POLICY "classes_service_write" ON public.classes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.question_sets
  ADD COLUMN class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL;

CREATE INDEX idx_question_sets_class
  ON public.question_sets(class_id);
