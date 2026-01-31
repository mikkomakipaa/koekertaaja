-- Drop map_questions table and associated resources
-- This migration removes the experimental map questions feature
-- Reason: Simplified product focus on core quiz/flashcard functionality

-- Drop indexes
DROP INDEX IF EXISTS idx_map_questions_question_set_id;
DROP INDEX IF EXISTS idx_map_questions_subject;
DROP INDEX IF EXISTS idx_map_questions_created_at;

-- Drop trigger
DROP TRIGGER IF EXISTS update_map_questions_updated_at ON map_questions;

-- Drop RLS policy
DROP POLICY IF EXISTS "Enable read access for all users" ON map_questions;

-- Drop table
DROP TABLE IF EXISTS map_questions;

-- Note: Foreign key references in question_sets were SET NULL,
-- so no orphaned data will remain after this migration.
