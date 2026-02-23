-- Backfill exam_date from created_at for existing question sets.
-- Safe to run multiple times: only updates rows where exam_date is NULL.

UPDATE public.question_sets
SET exam_date = (created_at AT TIME ZONE 'UTC')::date
WHERE exam_date IS NULL
  AND created_at IS NOT NULL;

DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled exam_date for % question sets', updated_count;
END $$;
