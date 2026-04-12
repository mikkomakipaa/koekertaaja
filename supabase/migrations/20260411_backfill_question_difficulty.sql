UPDATE questions q
SET difficulty = qs.difficulty
FROM question_sets qs
WHERE q.question_set_id = qs.id
  AND q.difficulty IS NULL
  AND qs.difficulty IS NOT NULL;
