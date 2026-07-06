# Legacy Profile Resolution

## Public behavior

- Active claimed profiles use Scholar.name customizations and cached OpenAlex data.
- If an active profile has no researcher cache, the public route fills its source data from OpenAlex without exposing or replacing researcher-owned fields.
- Inactive and orphaned claims render public OpenAlex previews with owner-specific banners.
- Database failures render OpenAlex previews with `claimState: database_unavailable`.
- A profile returns `404` only when OpenAlex confirms that the researcher does not exist.
- A profile returns `503` only when the required source data cannot be obtained.

## Legacy repair

- Startup migrations are serialized with a PostgreSQL advisory lock.
- Existing profile links are repaired only from an existing user tenant link or a unique profile-email to tenant-contact match.
- Ambiguous records are not reassigned. Administrators can review them through `/api/admin/legacy-profile-audit` and the admin dashboard warning.
- Migration logs report linked and unresolved profile totals.

## Rollout checks

1. `/api/health` must report both `connected: true` and `schemaReady: true`.
2. `/api/researcher/A5056485484/data` must return `200` with a valid `claimState`.
3. Zahi Abdul Sater's legacy subdomain must show either the active customized profile or the inactive OpenAlex preview.
4. Review the admin legacy-profile warning before manually changing any ambiguous ownership record.
