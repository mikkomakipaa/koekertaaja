UPDATE public.questions
SET question_text = regexp_replace(
  question_text,
  '^\s*(flashcard|fill[\s-]?in|multiple choice|multiple select|short answer|true or false|matching|sequential)\s*:\s*',
  '',
  'i'
)
WHERE question_text ~* '^\s*(flashcard|fill[\s-]?in|multiple choice|multiple select|short answer|true or false|matching|sequential)\s*:';
