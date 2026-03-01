-- Add multiple_select to questions_type_check constraint.
-- The question generator can produce multiple_select questions but the
-- constraint added by 20260212 does not include that type, causing 23514
-- (CHECK constraint violation) on every save that contains multiple_select rows.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS question_type_check;

ALTER TABLE public.questions
ADD CONSTRAINT questions_type_check CHECK (
  (question_type)::text = ANY (
    (ARRAY[
      'multiple_choice'::character varying,
      'multiple_select'::character varying,
      'fill_blank'::character varying,
      'true_false'::character varying,
      'short_answer'::character varying,
      'matching'::character varying,
      'sequential'::character varying,
      'flashcard'::character varying,
      'map'::character varying
    ])::text[]
  )
);
