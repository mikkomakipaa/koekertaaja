-- Backfill existing question_sets to 'published' status
-- This ensures existing question sets remain visible after status column was added
-- Run this migration after 20250219_add_status_to_question_sets.sql

-- Update all existing question sets to published status
-- We use a WHERE clause to be idempotent (safe to run multiple times)
UPDATE question_sets
SET status = 'published'
WHERE status = 'created';

-- Log the backfill result
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Backfilled % question sets to published status', updated_count;
END $$;

COMMENT ON TABLE question_sets IS 'Question sets with publishing workflow. Existing sets backfilled to published on 2025-02-19.';
