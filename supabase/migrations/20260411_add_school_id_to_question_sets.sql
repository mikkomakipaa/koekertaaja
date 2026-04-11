ALTER TABLE public.question_sets
  ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE INDEX idx_question_sets_school
  ON public.question_sets(school_id);
