-- Add exam_date for scheduled exam metadata on question sets.
-- Nullable to support gradual backfill of existing rows.
ALTER TABLE public.question_sets
ADD COLUMN IF NOT EXISTS exam_date date;

