# Backup: `/api/question-sets/submit`

This folder preserves the removed direct-import API route so it can be restored without relying on git history alone.

## Removed

- Active route removed from: `src/app/api/question-sets/submit/route.ts`
- Removal reason: reduce Vercel Hobby serverless function count; route was not used by the current in-app flow

## Backup Contents

- `route.ts.backup` — exact route implementation before removal

## Restore

1. Copy `route.ts.backup` back to `src/app/api/question-sets/submit/route.ts`
2. Re-check docs that mention `/api/question-sets/submit`
3. Run:
   - `npm run typecheck`
   - `npm run build`

## Notes

- Topic normalization helper `src/lib/topics/submitNormalization.ts` was intentionally left in place because it still has dedicated tests and may be reusable for future import workflows.
