-- Ensure questions_type_check supports flashcard rows.
-- Keep map for backward compatibility with historical data.
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS question_type_check;
ALTER TABLE public.questions DROP CONSTRAINT IF EXISTS questions_type_check;

ALTER TABLE public.questions
ADD CONSTRAINT questions_type_check CHECK (
  (question_type)::text = ANY (
    (ARRAY[
      'multiple_choice'::character varying,
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
