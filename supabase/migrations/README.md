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
