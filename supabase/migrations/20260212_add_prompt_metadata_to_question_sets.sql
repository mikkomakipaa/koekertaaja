-- Migration: Add prompt metadata to question sets
ALTER TABLE question_sets
ADD COLUMN IF NOT EXISTS prompt_metadata JSONB DEFAULT NULL;

-- Add index for querying by prompt metadata/version
CREATE INDEX IF NOT EXISTS idx_question_sets_prompt_metadata
ON question_sets USING gin(prompt_metadata);

COMMENT ON COLUMN question_sets.prompt_metadata IS
'Stores prompt version metadata: { versions: {...}, assembledAt: "...", hash: "..." }';
