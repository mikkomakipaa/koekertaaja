ALTER TABLE public.prompt_metrics
  ADD COLUMN school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL;

CREATE INDEX idx_prompt_metrics_school
  ON public.prompt_metrics(school_id);
