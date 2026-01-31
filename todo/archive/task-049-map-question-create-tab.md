# Task: Move map question creation to its own tab

## Context

- Why this is needed: Map question creation should be a first-class action, separated from the Manage section on the Create page.
- Related docs/links: `src/app/create/page.tsx`
- Related files:
  - `src/app/create/page.tsx`

## Scope

- In scope:
  - Add a dedicated tab (e.g., “Karttakysymys”) on the Create page.
  - Move the map question creation form from the Manage tab into the new tab.
  - Keep the Manage tab focused on listing/refreshing map questions (and any other management UI that remains).
- Out of scope:
  - API changes for map question creation.
  - Design system changes outside the Create page.

## Changes

- [ ] Update the TabsList to include a new tab for map question creation and adjust layout (grid columns).
- [ ] Relocate the “Luo karttakysymys” form block into the new tab.
- [ ] Ensure state, validation, and handlers for map question creation still work in the new tab.
- [ ] Keep the map question list/refresh UI in the Manage tab.

## Acceptance Criteria

- [ ] Create page shows a separate Map Question tab with the full creation form.
- [ ] Manage tab no longer contains the creation form and only shows the management list/tools.
- [ ] No functional regressions in map question creation.

## Testing

- [ ] Tests to run: manual UI check on `/create`.
- [ ] New/updated tests: none.
