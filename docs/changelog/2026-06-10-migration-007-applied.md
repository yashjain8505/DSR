## 2026-06-10 - linkrunner-dsr — Migration 007 applied to production DB

### Changed
- Applied `supabase/migrations/007_room_access.sql` to the production Supabase
  project (`iubstoakzckephkspsys`) via the Management API (`/database/query`),
  using a user-provided personal access token (since revoked).
- The user's earlier manual attempt had partially landed: `rooms.restrict_access`
  existed but `room_access` did not (the script aborted on the duplicate-column
  error when re-run). Re-applied idempotently (`if not exists` guards).

### Files touched
- None (DB-only operation) + this log entry.

### Verified
- Management API query confirms `room_access` table and `restrict_access` column exist.
- PostgREST (service-role) sees both; all rooms default `restrict_access=false`.
- Production: `POST /api/rooms/access-check` returns `{allowed:true}` for an
  unrestricted room; admin access-list endpoint returns 401 (auth) instead of
  the missing-table error.

### Notes
- Room Access is now fully functional — the admin Room Settings section shows
  the toggle + invite list after reload.
