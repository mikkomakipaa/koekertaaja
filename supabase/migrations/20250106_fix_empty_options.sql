-- Fix questions with empty or null options/pairs and add constraints
-- This migration ensures data integrity for question options and matching pairs

-- Step 1: Log questions with issues (for debugging)
-- This query identifies problematic records before deletion
DO $$
DECLARE
  multiple_choice_empty_count INTEGER;
  matching_empty_count INTEGER;
BEGIN
  -- Count multiple_choice questions with empty or null options
  SELECT COUNT(*) INTO multiple_choice_empty_count
  FROM questions
  WHERE question_type = 'multiple_choice'
    AND (options IS NULL OR jsonb_array_length(options) = 0);

  -- Count matching questions with empty or null pairs
  SELECT COUNT(*) INTO matching_empty_count
  FROM questions
  WHERE question_type = 'matching'
    AND (correct_answer IS NULL OR jsonb_array_length(correct_answer) = 0);

  -- Log the counts
  RAISE NOTICE 'Found % multiple_choice questions with empty/null options', multiple_choice_empty_count;
  RAISE NOTICE 'Found % matching questions with empty/null pairs', matching_empty_count;
END $$;

-- Step 2: Delete questions with invalid data
-- Multiple choice questions must have non-empty options array
DELETE FROM questions
WHERE question_type = 'multiple_choice'
  AND (options IS NULL OR jsonb_array_length(options) = 0);

-- Matching questions must have non-empty pairs in correct_answer
DELETE FROM questions
WHERE question_type = 'matching'
  AND (correct_answer IS NULL OR jsonb_array_length(correct_answer) = 0);

-- Step 3: Add CHECK constraints to prevent future issues
-- First, drop existing constraints if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_multiple_choice_options_check') THEN
    ALTER TABLE questions DROP CONSTRAINT questions_multiple_choice_options_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_matching_pairs_check') THEN
    ALTER TABLE questions DROP CONSTRAINT questions_matching_pairs_check;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_correct_answer_not_null_check') THEN
    ALTER TABLE questions DROP CONSTRAINT questions_correct_answer_not_null_check;
  END IF;
END $$;

-- Add constraint: multiple_choice questions must have options array with at least 2 elements
ALTER TABLE questions
ADD CONSTRAINT questions_multiple_choice_options_check
CHECK (
  question_type != 'multiple_choice'
  OR (options IS NOT NULL AND jsonb_array_length(options) >= 2)
);

-- Add constraint: matching questions must have pairs array with at least 1 element
ALTER TABLE questions
ADD CONSTRAINT questions_matching_pairs_check
CHECK (
  question_type != 'matching'
  OR (correct_answer IS NOT NULL AND jsonb_array_length(correct_answer) >= 1)
);

-- Add constraint: correct_answer must not be null for any question type
ALTER TABLE questions
ADD CONSTRAINT questions_correct_answer_not_null_check
CHECK (correct_answer IS NOT NULL);

-- Step 4: Update question_count in question_sets if any questions were deleted
-- This ensures the count matches the actual number of questions
UPDATE question_sets qs
SET question_count = (
  SELECT COUNT(*)
  FROM questions q
  WHERE q.question_set_id = qs.id
)
WHERE EXISTS (
  SELECT 1
  FROM questions q
  WHERE q.question_set_id = qs.id
  GROUP BY q.question_set_id
  HAVING COUNT(*) != qs.question_count
);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Empty options/pairs fixed and constraints added';
END $$;
