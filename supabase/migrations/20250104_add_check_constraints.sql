-- Add CHECK constraints to ensure data integrity
-- This migration fixes the "string did not match expected pattern" error

-- First, drop any existing restrictive constraints that may have been added through Supabase UI
-- (These commands will not error if the constraints don't exist)
DO $$
BEGIN
    -- Drop any existing subject constraint (app allows flexible subject input)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sets_subject_check') THEN
        ALTER TABLE question_sets DROP CONSTRAINT question_sets_subject_check;
    END IF;

    -- Drop existing constraints if they exist, so we can recreate them
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sets_code_check') THEN
        ALTER TABLE question_sets DROP CONSTRAINT question_sets_code_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sets_difficulty_check') THEN
        ALTER TABLE question_sets DROP CONSTRAINT question_sets_difficulty_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_type_check') THEN
        ALTER TABLE questions DROP CONSTRAINT questions_type_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sets_grade_check') THEN
        ALTER TABLE question_sets DROP CONSTRAINT question_sets_grade_check;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'question_sets_question_count_check') THEN
        ALTER TABLE question_sets DROP CONSTRAINT question_sets_question_count_check;
    END IF;
END $$;

-- Add CHECK constraint for code format (6 uppercase alphanumeric characters)
ALTER TABLE question_sets
ADD CONSTRAINT question_sets_code_check
CHECK (code ~ '^[A-Z0-9]{6}$');

-- Add CHECK constraint for difficulty values
ALTER TABLE question_sets
ADD CONSTRAINT question_sets_difficulty_check
CHECK (difficulty IN ('helppo', 'normaali', 'vaikea', 'mahdoton'));

-- Add CHECK constraint for question_type values
ALTER TABLE questions
ADD CONSTRAINT questions_type_check
CHECK (question_type IN ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'short_answer'));

-- Add CHECK constraint for grade range (1-13)
ALTER TABLE question_sets
ADD CONSTRAINT question_sets_grade_check
CHECK (grade IS NULL OR (grade >= 1 AND grade <= 13));

-- Add CHECK constraint for question_count (must be positive)
ALTER TABLE question_sets
ADD CONSTRAINT question_sets_question_count_check
CHECK (question_count > 0);

-- IMPORTANT: NO constraint on subject field - app allows flexible subject input
-- Users can enter any subject name (English, Math, Custom subjects, etc.)
