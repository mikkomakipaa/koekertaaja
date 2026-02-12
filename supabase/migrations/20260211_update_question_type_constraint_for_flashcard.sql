-- Allow canonical flashcard questions and sequential questions in questions table.
-- Keeps backward compatibility for existing quiz types.
ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS question_type_check;

ALTER TABLE public.questions
ADD CONSTRAINT question_type_check CHECK (
  question_type IN (
    'multiple_choice',
    'fill_blank',
    'true_false',
    'matching',
    'short_answer',
    'sequential',
    'flashcard'
  )
);
