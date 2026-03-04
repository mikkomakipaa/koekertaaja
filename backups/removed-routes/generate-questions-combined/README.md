# Backup: legacy combined `/api/generate-questions` route

This folder stores the repo-local backup for the removed combined generation route.

## Removed Route

- Original path: `src/app/api/generate-questions/route.ts`

## Why it was removed

- The current app flow uses:
  - `/api/generate-questions/quiz`
  - `/api/generate-questions/flashcard`
- The combined route no longer had an active frontend caller and consumed one extra Vercel serverless function slot.

## Restore

1. Copy `route.ts.backup` back to:
   - `src/app/api/generate-questions/route.ts`
2. Regenerate route types:
   - `node_modules/.bin/next typegen`
3. Re-run type validation:
   - `npm run typecheck`

## Notes

- This backup preserves the old combined `quiz | flashcard | both` orchestration behavior.
- Current production-facing docs should treat this route as removed unless it is explicitly restored.
