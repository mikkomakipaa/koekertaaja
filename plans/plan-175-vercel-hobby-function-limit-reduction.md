## Goal

Reduce the deployed serverless function count from 19 to 12 or fewer so the app can deploy on the Vercel Hobby plan again.

## Why

- Vercel Hobby allows at most 12 serverless functions per deployment.
- The current app produces 19 functions, which blocks all new deployments.
- The aim is to remove or consolidate route surfaces without breaking production behavior or creating one unsafe mega-route.

## Current Function Pressure

Known dynamic/serverless routes contributing to the limit include:

- `/api/delete-question-set`
- `/api/extend-question-set`
- `/api/generate-questions`
- `/api/generate-questions/flashcard`
- `/api/generate-questions/quiz`
- `/api/identify-topics`
- `/api/prompt-metrics/dashboard`
- `/api/question-flags`
- `/api/question-flags/manage`
- `/api/question-sets/by-code`
- `/api/question-sets/created`
- `/api/question-sets/play`
- `/api/question-sets/publish`
- `/api/question-sets/submit`
- `/api/questions/[id]`
- `/api/questions/delete-by-topic`
- `/dev/visual-regression/badges`
- `/play/[code]`
- `/play/speed-quiz/[code]`

Target reduction required: at least 7 functions.

## Design Constraints

1. Remove non-user-facing production routes first.
2. Prefer merging by responsibility and access pattern:
   - public reads together
   - authenticated/admin mutations together
3. Preserve existing request contracts where possible, or add compatibility redirects/adapters.
4. Avoid merging unrelated destructive and non-destructive operations unless unavoidable.

## Planned Reduction Order

1. Remove the deployed dev visual-regression page from production builds.
2. Collapse `/play/speed-quiz/[code]` into `/play/[code]` with compatibility handling.
3. Remove legacy routes that are no longer used by the current in-app flow.
4. Consolidate `question_sets` API routes into a smaller grouped surface.
5. Consolidate `question_flags` API routes if still needed after the above.
6. Only then evaluate whether question-management routes need further consolidation.

## Out of Scope

- Vercel plan upgrade
- Re-architecting all API routes into a single endpoint
- Unrelated product/UI work

## Validation Focus

- Route/function count is 12 or fewer in `next build`
- Existing user flows continue to work:
  - play by code
  - speed quiz
  - create/manage question sets
  - flag submission and admin review
- Old links continue to work where route collapse changes path shape
