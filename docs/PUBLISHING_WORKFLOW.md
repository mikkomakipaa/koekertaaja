# Publishing Workflow for Question Sets

## Overview

Question sets now have a publishing workflow with two states: `created` (unpublished) and `published` (visible on play pages).

## Status Column

The `question_sets.status` column uses the `question_set_status` enum type:

```sql
CREATE TYPE question_set_status AS ENUM ('created', 'published');

ALTER TABLE question_sets
ADD COLUMN status question_set_status DEFAULT 'created' NOT NULL;
```

## Behavior

### New Question Sets (after 2025-02-19)
- **Default status**: `created` (unpublished)
- **Visibility**: Not visible on public play pages
- **Admin action required**: Admin must explicitly publish the set
- **Future implementation**: Admin approval workflow (UI pending)

### Existing Question Sets (before 2025-02-19)
- **Backfilled status**: All existing sets were set to `published`
- **Migration**: `20250219_backfill_published_status.sql`
- **Visibility**: All existing sets remain visible on play pages
- **Rationale**: Prevents breaking change for existing users

## Row Level Security (RLS)

The RLS policy ensures only published question sets are publicly visible:

```sql
CREATE POLICY "Enable read access for published question sets" ON question_sets
  FOR SELECT USING (status = 'published');
```

**What this means:**
- ✅ Public users can only SELECT question sets where `status = 'published'`
- ❌ Question sets with `status = 'created'` are hidden from public reads
- 🔐 Server-side service role can access all sets (for admin workflows)

## API Endpoints

### Current Behavior
- **GET /api/question-sets**: Returns all published sets (RLS enforces this)
- **POST /api/generate-questions**: Creates sets with `status = 'created'` by default

### Future Admin Endpoints (to be implemented)
- **PUT /api/question-sets/:id/publish**: Set `status = 'published'` (admin only)
- **PUT /api/question-sets/:id/unpublish**: Set `status = 'created'` (admin only)
- **GET /api/admin/question-sets**: List all sets including unpublished (admin only)

## Database Migrations

### Migration 1: Add Status Column
**File**: `supabase/migrations/20250219_add_status_to_question_sets.sql`

**What it does:**
1. Creates `question_set_status` enum type
2. Adds `status` column (default: 'created')
3. Creates index on `status` column
4. Updates RLS policy to only show published sets

### Migration 2: Backfill Published Status
**File**: `supabase/migrations/20250219_backfill_published_status.sql`

**What it does:**
1. Updates all existing question sets to `status = 'published'`
2. Logs the count of backfilled sets
3. Is idempotent (safe to run multiple times)

**Why this is needed:**
- Ensures existing question sets remain visible after the status column was added
- Establishes baseline: all pre-migration sets are considered "published"

## Verification

Run the verification script to check migration success:

```bash
# Execute in Supabase SQL Editor
cat scripts/verify-backfill.sql
```

**Expected results:**
- All existing question sets should have `status = 'published'`
- RLS policy should exist with qualifier `status = 'published'`
- New question sets should default to `status = 'created'`

## Testing

### Manual Testing Steps

1. **Verify existing sets are visible:**
   ```sql
   SELECT code, name, status FROM question_sets LIMIT 10;
   ```
   All should show `status = 'published'`.

2. **Create a new question set:**
   - Use the Create page to generate a new set
   - Check the database: `SELECT status FROM question_sets WHERE code = 'ABC123';`
   - Should show `status = 'created'`

3. **Verify new set is NOT visible on Play page:**
   - Navigate to `/play`
   - The new unpublished set should not appear in the list

4. **Manually publish the set:**
   ```sql
   UPDATE question_sets SET status = 'published' WHERE code = 'ABC123';
   ```

5. **Verify set is NOW visible on Play page:**
   - Refresh `/play`
   - The set should now appear in the list

## Future Work

### Admin UI (Pending Implementation)
- Dashboard to list all unpublished question sets
- One-click "Publish" and "Unpublish" buttons
- Batch operations (publish multiple sets at once)
- Filtering and sorting by status, created_at, etc.

### Automated Publishing (Optional)
- Auto-publish after quality checks (e.g., 70%+ valid questions)
- Scheduled publishing (e.g., publish at specific time)
- User role permissions (e.g., teachers can publish their own sets)

### Audit Trail (Optional)
- Log who published/unpublished each set and when
- Track status change history
- Email notifications for status changes

## Rollback Plan

If the publishing workflow needs to be reverted:

```sql
-- 1. Publish all unpublished sets
UPDATE question_sets SET status = 'published' WHERE status = 'created';

-- 2. Drop the RLS policy
DROP POLICY IF EXISTS "Enable read access for published question sets" ON question_sets;

-- 3. Restore old permissive policy
CREATE POLICY "Enable read access for all users" ON question_sets
  FOR SELECT USING (true);

-- 4. (Optional) Drop the status column
ALTER TABLE question_sets DROP COLUMN IF EXISTS status;
DROP TYPE IF EXISTS question_set_status;
```

## Security Considerations

- **RLS enforcement**: Always rely on RLS policies, never client-side checks
- **Service role access**: Only server-side API routes can bypass RLS
- **Admin authentication**: Future admin endpoints must verify user permissions
- **Data integrity**: Status changes should be audited and logged

## References

- Migration README: `supabase/migrations/README.md`
- AGENTS.md: "Publishing Workflow (Question Sets)" section
- RLS Policy: "Enable read access for published question sets"
- Backfill migration: `20250219_backfill_published_status.sql`
