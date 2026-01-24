-- Add status column to question_sets for publishing workflow
-- Status can be 'created' (unpublished) or 'published' (visible on play pages)

-- Create enum type for status
DO $$ BEGIN
  CREATE TYPE question_set_status AS ENUM ('created', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column with default 'created'
ALTER TABLE question_sets
ADD COLUMN IF NOT EXISTS status question_set_status DEFAULT 'created' NOT NULL;

COMMENT ON COLUMN question_sets.status IS 'Publishing status: created (unpublished) or published (visible on play pages)';

-- Create index for efficient filtering by status
CREATE INDEX IF NOT EXISTS idx_question_sets_status ON question_sets(status);

-- Update RLS policy to only show published question sets to public
-- Drop old policy
DROP POLICY IF EXISTS "Enable read access for all users" ON question_sets;

-- Create new policy: only published sets are publicly visible
CREATE POLICY "Enable read access for published question sets" ON question_sets
  FOR SELECT USING (status = 'published');

-- Note: Authenticated users with appropriate permissions can access 'created' sets
-- through separate policies (to be added based on role management requirements)
