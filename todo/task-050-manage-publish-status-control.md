# Task: Add publish status control in Manage list

## Context

- Why this is needed: Manage view should allow changing a question set’s publish status directly from the list.
- Related docs/links: `src/app/create/page.tsx`, `/api/question-sets/publish`
- Related files:
  - `src/app/create/page.tsx`
  - `src/app/api/question-sets/publish/route.ts`

## Scope

- In scope:
  - Add a clear UI control in Manage list to toggle status between `created` and `published`.
  - Ensure the control uses the existing publish API and respects admin permissions.
  - Keep the list showing both published and created sets.
- Out of scope:
  - New roles/permissions or backend auth changes.
  - New API endpoints.

## Changes

- [ ] Add a publish/unpublish button or toggle in each Manage list item.
- [ ] Wire control to `handlePublishToggle` (or equivalent) and refresh list after change.
- [ ] Disable control and show loading state while request is in flight.
- [ ] Ensure non-admin users cannot see or use the control (if required by existing UX).

## Acceptance Criteria

- [ ] Manage list displays current status for each set.
- [ ] Admin can change status from the list without leaving the page.
- [ ] List refreshes to reflect new status.
- [ ] Non-admin users don’t see the status control (if current behavior hides admin actions).

## Testing

- [ ] Manual: toggle a set from `created` → `published` and back.
- [ ] Manual: verify non-admin view hides the control.
- [ ] New/updated tests: none.
