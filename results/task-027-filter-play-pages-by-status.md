## Summary

I've successfully implemented filtering to ensure only published question sets are visible on Play pages. Here's what was changed:

### Changes Made

**src/lib/supabase/queries.ts:**
- ✅ Updated `getQuestionSetByCode()` - Added `.eq('status', 'published')` filter
- ✅ Updated `getRecentQuestionSets()` - Added `.eq('status', 'published')` filter
- ✅ Updated `getQuestionSetsBySubject()` - Added `.eq('status', 'published')` filter
- ✅ Updated `getAllQuestionSets()` - Added `.eq('status', 'published')` filter

**src/app/play/[code]/page.tsx:**
- ✅ Improved error messages to indicate when a set is not found or unpublished
  - Single set: "Kysymyssarjaa ei löytynyt koodilla: {code}. Tarkista koodi tai varmista että kysymyssarja on julkaistu."
  - Multiple sets: "Kysymyssarjoja ei löytynyt. Tarkista koodit tai varmista että kysymyssarjat on julkaistu."

### How It Works

1. **Browse listing (`/play`)**: Only published sets appear because `getRecentQuestionSets()` filters by `status = 'published'`

2. **Code access (`/play/[code]`)**: Unpublished sets return `null` from `getQuestionSetByCode()`, triggering an error screen with a clear message

3. **All query functions**: Every function that retrieves question sets for public viewing now filters by published status

### Acceptance Criteria Met

- ✅ Unpublished sets do not appear in browse list
- ✅ Accessing unpublished set by code is blocked (returns error)
- ✅ TypeScript compilation passes

### Testing Notes

For manual testing:
1. **Create unpublished set**: Create a new question set (status defaults to 'created') - verify it does NOT appear in `/play` list
2. **Access by code**: Try accessing the unpublished set via `/play/[CODE]` - verify error message appears
3. **Publish set**: Update the set's status to 'published' - verify it now appears in `/play` list and is playable via code
