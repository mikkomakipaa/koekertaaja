Updated the create page to use enabled subject configs, added custom subject + type selection (with guidance copy), and made question count/grade requirements dynamic per subject type. Main changes are in `src/app/create/page.tsx` and `src/components/create/GradeSelector.tsx` to wire subject type into form state, enforce required grade, and cap counts at 200.

Next steps you can run:
1) Manual: create a set with a predefined subject and confirm the `/api/generate-questions` payload includes `subjectType`.
2) Manual: create a custom subject, select a subject type + grade, and confirm validation blocks until both are set.
