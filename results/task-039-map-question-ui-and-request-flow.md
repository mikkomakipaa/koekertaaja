Added a dedicated map question creation flow in the Create → Manage UI and wired it to a new `/api/map-questions/submit` endpoint so admins can create and immediately see map questions. The UI additions live in `src/app/create/page.tsx`, and the new API routes are `src/app/api/map-questions/submit/route.ts` for creation and `src/app/api/map-questions/created/route.ts` for listing with question set status context.

Details:
- New map question form + listing section in `src/app/create/page.tsx` so admins can create standalone or attached map questions and see draft/published state when linked.
- New creation endpoint in `src/app/api/map-questions/submit/route.ts` validates input and writes via the admin Supabase helper.
- New management list endpoint in `src/app/api/map-questions/created/route.ts` returns map questions with linked question set metadata.

Tests not run.

Next steps:
1) Manually create a map question from the Manage tab and confirm it appears in the list.
2) If needed, attach to a draft question set and verify the draft/published badge.
