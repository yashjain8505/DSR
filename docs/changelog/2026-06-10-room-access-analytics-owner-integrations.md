## 2026-06-10 - linkrunner-dsr — Room access control, per-visitor analytics, next-steps Owner tag, integrations promise

### Changed
- **Integrations tab (all rooms):** new callout — Linkrunner can integrate with any ad network, analytics platform, or affiliate partner; with a warm connection it typically ships in ≤7 days.
- **Next Steps tab:** "OWNER" label now renders above the team logo avatars on each step; admin editor toggle relabeled "Show owner logos" (assignment UI already existed as "Owned by" chips).
- **Per-visitor analytics drilldown:** room analytics → Recent Visitors rows are now expandable; clicking a visitor fetches their full event timeline (opened room, tab/section views, link clicks, video plays, time in room) via new admin endpoint `GET /api/rooms/[roomId]/analytics/visitors/[visitorId]`.
- **Room access control (requires migration 007):**
  - `rooms.restrict_access` flag + `room_access` allowlist table (`supabase/migrations/007_room_access.sql` — run by hand).
  - Admin Room Settings → new "Room Access" section: toggle restriction (applies immediately via PATCH), invite/remove emails.
  - `POST /api/visitors` enforces the allowlist for restricted rooms (403 with friendly message); email gate displays it.
  - Returning visitors (localStorage) re-validated via public `POST /api/rooms/access-check`; removed visitors fall back to the gate. Fails open pre-migration, fails closed on network errors.

### Files touched
- `supabase/migrations/007_room_access.sql` (new)
- `src/app/api/rooms/[roomId]/access/route.ts`, `src/app/api/rooms/access-check/route.ts`, `src/app/api/rooms/[roomId]/analytics/visitors/[visitorId]/route.ts` (new)
- `src/app/api/visitors/route.ts` (allowlist enforcement; room lookup moved before visitor upsert)
- `src/components/room/{email-gate,room-client-wrapper,integrations,tab-next-steps}.tsx`
- `src/app/(admin)/admin/rooms/[roomId]/{page,analytics/page,meeting-brief/page}.tsx`
- `src/lib/types/index.ts` (Room.restrict_access, RoomAccessEntry, VisitorEventEntry)

### Verified
- `npm run build` passes. Lint: only pre-existing issues (room-client-wrapper set-state-in-effect predates this change).
- Live smoke test on local `next start` (:3457, env-override admin password): new admin routes 401 unauthenticated; pre-migration access-check returns `allowed:true` and access list shows a clear missing-table error; visitor timeline returned real event history for an existing visitor.

### Notes
- **Pending:** run `supabase/migrations/007_room_access.sql` in the Supabase SQL editor to activate access control. Everything else works without it; the Room Access admin section shows a migration hint until then.
- `access-check` is intentionally public (returning-visitor validation); it can confirm whether a given email is allowed for a room — acceptable for v1, noted for any future RLS/security pass.
