# Task: Filter Play pages to only show published sets

## Context

- Only published question sets should be visible on Play pages.
- Set access by code should be blocked for unpublished sets.

## Scope

- In scope:
  - Update queries used by play listing and code lookup to filter by `status = published`.
  - Return clear errors when accessing unpublished sets by code.
- Out of scope:
  - Any changes to public sharing beyond status check.

## Changes

- [ ] Update `src/lib/supabase/queries.ts` functions to filter by status where appropriate.
- [ ] Ensure `/play` list only shows published sets.
- [ ] Ensure `/play/[code]` returns 404 or error for unpublished sets.

## Acceptance Criteria

- [ ] Unpublished sets do not appear in browse list.
- [ ] Accessing unpublished set by code is blocked.

## Testing

- [ ] Manual: create set (created), confirm it does not appear in play list.
- [ ] Manual: publish set, confirm it appears and is playable.
