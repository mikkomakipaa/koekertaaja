ALTER TABLE public.question_sets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.question_sets.user_id IS 'Owner of the generated question set when created by an authenticated user.';

CREATE INDEX IF NOT EXISTS idx_question_sets_user_id
  ON public.question_sets(user_id);
