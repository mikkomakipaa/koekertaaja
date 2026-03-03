-- Backfill subject_type for question sets created before the subject_type column was added
-- (migration 20250207_add_subject_type_and_question_subtopic.sql added the column without backfilling)
--
-- Mapping matches SUBJECT_TYPE_MAPPING in src/lib/prompts/subjectTypeMapping.ts

UPDATE question_sets
SET subject_type = CASE subject
  -- Language subjects
  WHEN 'english'            THEN 'language'
  WHEN 'englanti'           THEN 'language'
  WHEN 'finnish'            THEN 'language'
  WHEN 'suomi'              THEN 'language'
  WHEN 'äidinkieli'         THEN 'language'
  WHEN 'swedish'            THEN 'language'
  WHEN 'ruotsi'             THEN 'language'
  -- Math subjects
  WHEN 'math'               THEN 'math'
  WHEN 'matematiikka'       THEN 'math'
  WHEN 'physics'            THEN 'math'
  WHEN 'fysiikka'           THEN 'math'
  WHEN 'chemistry'          THEN 'math'
  WHEN 'kemia'              THEN 'math'
  -- Written/content subjects
  WHEN 'biology'            THEN 'written'
  WHEN 'biologia'           THEN 'written'
  WHEN 'environmental-studies' THEN 'written'
  WHEN 'ympäristöoppi'      THEN 'written'
  WHEN 'history'            THEN 'written'
  WHEN 'historia'           THEN 'written'
  WHEN 'society'            THEN 'written'
  WHEN 'yhteiskuntaoppi'    THEN 'written'
  -- Geography
  WHEN 'geography'          THEN 'geography'
  WHEN 'maantiede'          THEN 'geography'
  WHEN 'maantieto'          THEN 'geography'
  -- Concepts subjects
  WHEN 'religion'           THEN 'concepts'
  WHEN 'uskonto'            THEN 'concepts'
  WHEN 'ethics'             THEN 'concepts'
  WHEN 'elämänkatsomustieto' THEN 'concepts'
  WHEN 'philosophy'         THEN 'concepts'
  -- Skills subjects
  WHEN 'art'                THEN 'skills'
  WHEN 'kuvataide'          THEN 'skills'
  WHEN 'music'              THEN 'skills'
  WHEN 'musiikki'           THEN 'skills'
  WHEN 'pe'                 THEN 'skills'
  WHEN 'liikunta'           THEN 'skills'
  WHEN 'crafts'             THEN 'skills'
  WHEN 'käsityö'            THEN 'skills'
  -- Fallback for unknown subjects
  ELSE 'written'
END
WHERE subject_type IS NULL;
