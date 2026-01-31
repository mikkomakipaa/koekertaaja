# Task: Add admin publish/unpublish API

## Context

- Admin needs to publish sets by changing `status`.
- There is no role system; use a simple admin allowlist check.

## Scope

- In scope:
  - Add API route to update `question_sets.status`.
  - Gate access via allowlist (e.g., `ADMIN_EMAILS` env).
  - Return consistent errors for unauthorized access.
- Out of scope:
  - Full RBAC system.

## Changes

- [ ] Add `ADMIN_EMAILS` (comma-separated) support in server auth helper.
- [ ] Create API route `/api/question-sets/publish` (PATCH) to set status.
- [ ] Ensure only authenticated allowlisted users can change status.

## Acceptance Criteria

- [ ] Non-admins receive 403 when attempting to publish.
- [ ] Admin can set status to `published` or `created`.

## Testing

- [ ] Unit/API: admin publish succeeds, non-admin fails.
