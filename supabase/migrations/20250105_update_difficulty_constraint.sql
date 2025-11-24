-- Migration: Update difficulty constraint to remove 'mahdoton' level
-- Date: 2025-01-05
-- Description: Reduces difficulty levels from 4 to 3 (helppo, normaali, vaikea)

-- Drop the old constraint
ALTER TABLE question_sets
DROP CONSTRAINT IF EXISTS question_sets_difficulty_check;

-- Add the new constraint with only 3 difficulty levels
ALTER TABLE question_sets
ADD CONSTRAINT question_sets_difficulty_check
CHECK (difficulty IN ('helppo', 'normaali', 'vaikea'));
