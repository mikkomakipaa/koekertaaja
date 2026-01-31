# Database Migrations

This folder contains Supabase database migrations for the Exam Prepper application.

## Migrations

### 20250103_initial_schema.sql
Initial database schema with:
- `question_sets` table
- `questions` table
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for updated_at timestamps

### 20250104_add_check_constraints.sql
Adds CHECK constraints to ensure data integrity and fixes the "string did not match expected pattern" error.

**Important:** This migration specifically **removes** any restrictive constraint on the `subject` field, as the application is designed to allow flexible subject input (users can enter any subject name, not just predefined ones like 'english', 'math', etc.).

The migration:
1. Drops any existing restrictive constraints (including subject constraints)
2. Adds proper CHECK constraints for:
   - `code`: Must match `^[A-Z0-9]{6}$` pattern
   - `difficulty`: Must be one of ('helppo', 'normaali', 'vaikea', 'mahdoton')
   - `question_type`: Must be one of ('multiple_choice', 'fill_blank', 'true_false', 'matching', 'short_answer')
   - `grade`: Must be NULL or between 1-13
   - `question_count`: Must be positive

3. Explicitly does NOT add a constraint on `subject` field - allows any string value

### 20250105_update_difficulty_constraint.sql
Updates the difficulty constraint to support additional difficulty levels.

### 20250106_fix_empty_options.sql
Fixes existing questions with empty or null options/pairs and adds constraints to prevent future occurrences.

This migration:
1. **Identifies and logs** questions with data issues (empty/null options or pairs)
2. **Deletes invalid questions**:
   - Multiple choice questions with empty or null `options` arrays
   - Matching questions with empty or null `pairs` in `correct_answer`
3. **Adds database constraints** to prevent future issues:
   - `questions_multiple_choice_options_check`: Ensures multiple_choice questions have at least 2 options
   - `questions_matching_pairs_check`: Ensures matching questions have at least 1 pair
   - `questions_correct_answer_not_null_check`: Ensures correct_answer is never null
4. **Updates question_count** in question_sets to reflect actual question counts after deletion

**Why this is needed:**
- Questions without options or pairs cannot be answered by students
- Prevents data integrity issues that cause UI errors
- Ensures database constraints match application-level validation

**Complementary changes:**
- Application-level validation in `src/lib/validation/schemas.ts` enforces the same rules
- Question generator in `src/lib/ai/questionGenerator.ts` filters out invalid questions before insertion

### 20250130_add_mode_column.sql
Adds `mode` column to distinguish quiz sets from flashcard sets.

This migration:
1. **Adds mode column** to `question_sets` table
   - Type: VARCHAR(20) with CHECK constraint ('quiz' | 'flashcard')
   - Default value: 'quiz' for all existing records
2. **Creates index** on mode column for efficient filtering
3. **Migrates existing flashcard sets** identified by "- Kortit" naming convention
4. **Adds column comment** for documentation

**Why this is needed:**
- Explicitly identifies flashcard sets vs quiz sets (replaces naming convention)
- Enables future flashcard-specific features (spaced repetition, different UI)
- Allows proper filtering and querying by mode
- Removes fragile dependency on naming patterns

**Testing the migration:**
```sql
-- Verify mode column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'question_sets' AND column_name = 'mode';

-- Check existing flashcard sets were migrated
SELECT name, difficulty, mode
FROM question_sets
WHERE name LIKE '% - Kortit';

-- Count question sets by mode
SELECT mode, COUNT(*)
FROM question_sets
GROUP BY mode;
```

**Rollback (if needed):**
```sql
DROP INDEX IF EXISTS idx_question_sets_mode;
ALTER TABLE question_sets DROP COLUMN IF EXISTS mode;
```

### 20250130_add_delete_policies.sql
Adds explicit RLS policies for DELETE, INSERT, and UPDATE operations.

This migration:
1. **Adds DELETE policies** for service role operations
   - `question_sets`: Allow DELETE with service role
   - `questions`: Allow DELETE with service role
2. **Adds INSERT policies** for question creation
   - Required for server-side question generation
3. **Adds UPDATE policies** for future flexibility
4. **Verifies RLS remains enabled** on both tables

**Why this is needed:**
- Service role should bypass RLS, but explicit policies are best practice
- Fixes 403 errors when deleting question sets
- Ensures all CRUD operations have proper policies
- Improves security posture with explicit permissions

**Note:** These policies use `USING (true)` and `WITH CHECK (true)` which means they allow all operations. This is safe because:
- These policies only apply when using the service role key (server-side)
- Client-side requests still only have SELECT access
- Service role key is never exposed to clients

### 20250130_add_topic_to_questions.sql
Adds `topic` column to questions table for topic-based stratified sampling.

This migration:
1. **Adds topic column** to `questions` table
   - Type: TEXT (nullable for gradual migration)
   - Stores high-level topic tags (e.g., "Grammar", "Vocabulary", "Laskutoimitukset")
2. **Creates indexes** for efficient topic-based queries
   - `idx_questions_topic`: Single column index
   - `idx_questions_set_topic`: Composite index for common query pattern
3. **Enables balanced question distribution** across topics in test sessions

**Why this is needed:**
- Ensures fair topic coverage in tests (e.g., 5 Grammar + 5 Vocabulary + 5 Reading vs. random 12 Grammar + 3 Vocabulary)
- AI identifies 3-5 high-level topics from material during generation
- Stratified sampling ensures equal distribution when selecting questions
- Foundation for future topic-specific analytics and practice modes

**How it works:**
1. During generation: AI analyzes material, identifies topics, tags each question
2. During test selection: Questions grouped by topic, sampled evenly from each
3. Graceful fallback: If <70% questions have topics, falls back to random sampling

**Testing the migration:**
```sql
-- Verify topic column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'topic';

-- Check topic distribution in a question set
SELECT topic, COUNT(*) as count
FROM questions
WHERE question_set_id = 'YOUR_QUESTION_SET_ID'
GROUP BY topic;
```

### 20250219_add_status_to_question_sets.sql
Adds `status` column to question_sets for publishing workflow.

This migration:
1. **Creates enum type** `question_set_status` with values ('created', 'published')
2. **Adds status column** to `question_sets` table
   - Type: question_set_status
   - Default value: 'created' for new sets
   - NOT NULL constraint
3. **Creates index** on status column for efficient filtering
4. **Updates RLS policy** to only show published sets to public
   - Drops old "Enable read access for all users" policy
   - Creates new "Enable read access for published question sets" policy

**Why this is needed:**
- Enables admin review/approval workflow before publishing question sets
- Prevents unvalidated content from appearing on play pages
- Allows gradual migration of existing sets to published status
- Improves content quality and moderation capabilities

### 20250219_backfill_published_status.sql
Backfills existing question_sets to 'published' status to maintain visibility.

This migration:
1. **Updates all existing question sets** to status = 'published'
2. **Logs the backfill count** for audit purposes
3. **Is idempotent** - safe to run multiple times (only updates 'created' sets)

**Why this is needed:**
- Ensures existing question sets remain visible after status column was added
- Prevents breaking change for users expecting existing sets to be available
- Establishes baseline: all pre-migration sets are considered "published"
- New sets created after migration will default to 'created' and require explicit publishing

**Testing the backfill:**
```sql
-- Verify all question sets are published
SELECT status, COUNT(*)
FROM question_sets
GROUP BY status;

-- Check specific set is visible
SELECT code, name, status
FROM question_sets
WHERE code = 'YOUR_CODE';
```

### 20250131_add_skill_to_questions.sql
Adds `skill` column to questions table for skill-based tagging and analytics.

### 20250207_add_subject_type_and_question_subtopic.sql
Adds `subject_type` to question_sets and `subtopic` to questions for enhanced categorization.

### 20260119_add_exam_length.sql
Adds `exam_length` column to question_sets to track the number of questions per exam session.

### 20260128_add_question_flags.sql
Adds question flagging system for quality control and user feedback.

This migration:
1. **Adds flags column** to `questions` table (JSONB array)
2. **Stores flag metadata**: flag type, timestamp, reporter info
3. **Enables admin moderation** workflow for reported questions

### 20260203_add_map_questions_table.sql
**[DEPRECATED - Removed in 20260204]** Created experimental map_questions table for interactive geography questions.

This migration was part of an experimental map-based question feature that was later removed to simplify product focus.

### 20260204_drop_map_questions_table.sql
Removes the experimental map questions feature and all associated database objects.

This migration:
1. **Drops indexes** for map_questions table
   - `idx_map_questions_question_set_id`
   - `idx_map_questions_subject`
   - `idx_map_questions_created_at`
2. **Drops trigger** `update_map_questions_updated_at`
3. **Drops RLS policy** "Enable read access for all users"
4. **Drops table** `map_questions`

**Why this was removed:**
- Simplified product focus on core quiz and flashcard functionality
- Map feature added complexity without sufficient user adoption
- Maintenance burden outweighed benefits
- Streamlined codebase and database schema

**Data safety:**
- Foreign key references were SET NULL, so no orphaned data remains
- Migration is safe to run on databases with or without existing map data

### 20260131_fix_questions_rls_policy.sql
Restricts public SELECT access on `questions` to only those belonging to published question sets.

This migration:
1. Drops the old unrestricted SELECT policy on `questions`
2. Adds a new policy that checks the parent `question_sets.status = 'published'`
3. Keeps service-role access unaffected (service role bypasses RLS)

**Why this is needed:**
- Prevents draft/unpublished questions from being exposed publicly
- Aligns question visibility with question set publishing workflow

**Testing the migration:**
```sql
-- Create a draft question set and question
INSERT INTO question_sets (code, name, subject, difficulty, mode, question_count, status)
VALUES ('ZZZZZZ', 'Draft Set', 'Test', 'normaali', 'quiz', 1, 'created');

INSERT INTO questions (question_set_id, question_text, question_type, correct_answer, explanation, order_index)
SELECT id, 'Draft question?', 'multiple_choice', 'a', 'Test explanation', 0
FROM question_sets WHERE code = 'ZZZZZZ';

-- As anon: should return 0 rows
SELECT * FROM questions WHERE question_set_id IN (SELECT id FROM question_sets WHERE code = 'ZZZZZZ');

-- Publish and verify visibility
UPDATE question_sets SET status = 'published' WHERE code = 'ZZZZZZ';
SELECT * FROM questions WHERE question_set_id IN (SELECT id FROM question_sets WHERE code = 'ZZZZZZ');
```

### 20260131_add_question_flags_policies.sql
Adds explicit RLS policies for `question_flags`.

This migration:
1. Allows anonymous INSERT for flag submission
2. Denies SELECT for non-service-role clients
3. Denies DELETE for non-service-role clients

**Why this is needed:**
- Makes the intended access model explicit and stable
- Keeps moderation access restricted to service role/admin tooling

**Testing the migration:**
```sql
-- As anon: INSERT should succeed, SELECT/DELETE should fail
INSERT INTO question_flags (question_id, question_set_id, reason, client_id)
VALUES ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000', 'other', 'client-test');

SELECT * FROM question_flags LIMIT 1; -- should be denied
DELETE FROM question_flags WHERE client_id = 'client-test'; -- should be denied
```

## Running Migrations

If you're using Supabase CLI:
```bash
supabase db push
```

If you're using the Supabase Dashboard:
1. Go to SQL Editor
2. Copy the migration file content
3. Execute the SQL

## Troubleshooting

### "The string did not match the expected pattern" Error

This error occurs when:
1. There's a CHECK constraint on the `subject` field limiting it to specific values
2. Users try to create question sets with free-form subject names

**Solution:** Run the `20250104_add_check_constraints.sql` migration to remove the restrictive subject constraint.

### Constraint Already Exists Error

The `20250104_add_check_constraints.sql` migration is designed to be idempotent - it first drops existing constraints before recreating them, so it's safe to run multiple times.
