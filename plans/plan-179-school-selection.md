# Plan: School Selection Feature

## Decisions

| # | Question | Answer |
|---|----------|--------|
| 1 | Who assigns sets to schools? | Admin only |
| 2 | Sets per school | Single school per set (FK on `question_sets`) |
| 3 | Selection persistence | `localStorage` (sticky) |
| 4 | Can play without school? | No — school gates content |
| 5 | School source | Real list — only schools with published sets visible |

---

## Flow

```
/ → "Aloita pelaaminen" → /play/select-school → /play (filtered by school)
                                                     ↕ school switcher dropdown
```

- `/play/select-school` — searchable list, writes `{ schoolId, schoolName }` to `localStorage` key `kk_selected_school`, then redirects to `/play?mode=pelaa`
- Home page "Aloita pelaaminen" checks localStorage — if no school selected, redirects to `/play/select-school`
- Direct `/play/[code]` still works as-is (no bypass removal)

---

## DB Migrations

### Migration 1 — `schools` table
File: `supabase/migrations/20260411_add_schools_table.sql`

```sql
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  municipality TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_public_read" ON schools
  FOR SELECT USING (true);

-- Phase 1: service role only. Replaced by school_members policy in phase 2.
CREATE POLICY "schools_admin_write" ON schools
  FOR ALL USING (auth.role() = 'service_role');
```

### Migration 2 — link `question_sets` → `schools`
File: `supabase/migrations/20260411_add_school_id_to_question_sets.sql`

```sql
ALTER TABLE question_sets
  ADD COLUMN school_id UUID REFERENCES schools(id) ON DELETE SET NULL;

CREATE INDEX idx_question_sets_school ON question_sets(school_id);
```

- Nullable → existing sets unaffected, no data loss

### Migration 3 — future-proof stubs for multi-user admin (schema only, no UI yet)
File: `supabase/migrations/20260411_add_school_members_and_classes.sql`

```sql
-- User ↔ School membership + role
-- Enables per-school RLS and multi-admin support in phase 2
CREATE TABLE school_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, school_id)
);

ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;

-- Members can read their own memberships
CREATE POLICY "school_members_self_read" ON school_members
  FOR SELECT USING (user_id = auth.uid());

-- Service role manages memberships in phase 1
CREATE POLICY "school_members_service_write" ON school_members
  FOR ALL USING (auth.role() = 'service_role');

-- Classes within a school
-- Enables class-level question set targeting in phase 2
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,   -- e.g. "7B", "Äidinkieli ryhmä 2"
  grade INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Public read (students need to list classes for their school)
CREATE POLICY "classes_public_read" ON classes
  FOR SELECT USING (true);

-- Service role manages classes in phase 1
CREATE POLICY "classes_service_write" ON classes
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: class_id on question_sets (NULL = school-wide, set = class-specific)
ALTER TABLE question_sets
  ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE SET NULL;
```

> **Phase 2 RLS upgrade** (when multi-user admin UI is built): replace `service_role`
> policies on `question_sets` with membership-scoped policies:
> ```sql
> CREATE POLICY "school_member_write" ON question_sets
>   FOR INSERT WITH CHECK (
>     school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid())
>   );
> CREATE POLICY "school_member_update" ON question_sets
>   FOR UPDATE USING (
>     school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid())
>   );
> ```

---

## Implementation Checklist

### Step 1 — Migrations + Types
- [ ] Create `supabase/migrations/20260411_add_schools_table.sql`
- [ ] Create `supabase/migrations/20260411_add_school_id_to_question_sets.sql`
- [ ] Create `supabase/migrations/20260411_add_school_members_and_classes.sql` (stubs, no UI)
- [ ] Add `School`, `SchoolMember`, `Class` types to `src/types/index.ts`
- [ ] Add `school_id?: string` and `class_id?: string` to `QuestionSet` type

### Step 2 — Data Layer
- [ ] Create `src/lib/supabase/schools.ts`
  - `getSchools()` — schools with at least one published set
  - `getQuestionSetsBySchool(schoolId)` — filter by school
- [ ] Update `src/lib/supabase/queries.ts`
  - Add optional `schoolId` param to `getRecentQuestionSets` and `fetchPublishedQuestionSets`

### Step 3 — School Selection Hook
- [ ] Create `src/hooks/useSelectedSchool.ts`
  - Read/write `kk_selected_school` from localStorage
  - Returns `{ schoolId, schoolName, setSchool, clearSchool }`

### Step 4 — School Select Page
- [ ] Create `src/app/play/select-school/page.tsx` (route shell)
- [ ] Create `src/components/play/SchoolSelectPage.tsx`
  - Search input (filter by name/municipality)
  - Scrollable list of school cards
  - Tap-to-select → writes localStorage → redirects to `/play?mode=pelaa`
  - No skip option

### Step 5 — Home Page Guard
- [ ] Update `src/app/page.tsx`
  - "Aloita pelaaminen" checks `kk_selected_school` in localStorage
  - If not set → redirect to `/play/select-school`
  - If set → proceed as normal

### Step 6 — Play Page Filtering + Switcher
- [ ] Create `src/components/play/SchoolSwitcher.tsx`
  - Compact dropdown showing current school name
  - Opens school list to change selection
  - Writes to localStorage, re-filters question sets
- [ ] Update `src/app/play/page.tsx`
  - Pass `schoolId` from localStorage to `PlayBrowsePageClient`
- [ ] Update `src/components/play/PlayBrowsePageClient.tsx`
  - Accept `schoolId` prop
  - Filter question sets by school
  - Render `SchoolSwitcher` in header/toolbar

### Step 7 — Create Form (Admin)
- [ ] Update `src/app/create/page.tsx`
  - Add school selector field (combobox/select)
  - Admin-facing: assigns `school_id` to new question set

---

## New Files Summary

| File | Purpose |
|------|---------|
| `src/app/play/select-school/page.tsx` | Route shell |
| `src/components/play/SchoolSelectPage.tsx` | School search + list UI |
| `src/components/play/SchoolSwitcher.tsx` | Dropdown on play page |
| `src/hooks/useSelectedSchool.ts` | localStorage read/write hook |
| `src/lib/supabase/schools.ts` | DB queries for schools |
| `supabase/migrations/20260411_add_schools_table.sql` | Schools table |
| `supabase/migrations/20260411_add_school_id_to_question_sets.sql` | FK on question_sets |
| `supabase/migrations/20260411_add_school_members_and_classes.sql` | Stubs: school_members, classes, class_id on question_sets |

## Modified Files Summary

| File | Change |
|------|--------|
| `src/app/page.tsx` | School guard on primary action |
| `src/app/play/page.tsx` | Pass schoolId to browse client |
| `src/components/play/PlayBrowsePageClient.tsx` | Filter + SchoolSwitcher |
| `src/lib/supabase/queries.ts` | schoolId param on fetch functions |
| `src/app/create/page.tsx` | School selector field |
| `src/types/index.ts` | School type + school_id on QuestionSet |

---

## Out of Scope (Phase 1)
- Per-school analytics (no `school_id` on game sessions)
- Class selection in student flow (Option A chosen — school only)
- OPH registry integration (manual school entry only)
- Code-bypass removal (`/play/[code]` still works directly)

## Phase 2 — Multi-User Admin (future)
Schema is already in place via migration 3 stubs. Phase 2 requires:
- Auth: login flow for school admins/teachers
- `school_members` populated when admin account is created
- RLS on `question_sets` upgraded from service_role to membership-scoped policies (see migration 3 note)
- Create form: school auto-assigned from `school_members`, no dropdown needed
- Optional class selector on create form (`class_id`)
- Admin dashboard: manage sets for their school only
- Super admin UI: manage schools + assign admin accounts
