ALTER TABLE public.school_members
  DROP CONSTRAINT IF EXISTS school_members_role_check;

ALTER TABLE public.school_members
  ADD CONSTRAINT school_members_role_check CHECK (role IN ('admin'));
