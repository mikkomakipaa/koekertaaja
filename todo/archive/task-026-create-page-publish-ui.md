# Task: Add publish toggle in Create > Manage UI

## Context

- Admin should publish sets from the Create page.
- Only published sets are visible on Play pages.

## Scope

- In scope:
  - Add status indicator and publish/unpublish button in Manage tab.
  - Call the publish API route.
  - Show status chip in list.
- Out of scope:
  - Bulk publish operations.

## Changes

- [ ] Update `src/app/create/page.tsx` manage list to display status.
- [ ] Add publish/unpublish button (admin only, gated by API response).
- [ ] Update list refresh to reflect status changes.

## Acceptance Criteria

- [ ] Admin can publish/unpublish from Manage tab.
- [ ] Status is visible next to each set.

## Testing

- [ ] Manual: publish a set and verify status UI updates.
