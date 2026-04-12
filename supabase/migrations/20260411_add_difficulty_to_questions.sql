ALTER TABLE questions
ADD COLUMN difficulty TEXT
CHECK (difficulty IN ('helppo', 'normaali', 'vaikea'));
