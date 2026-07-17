## 2026-07-18 - linkrunner-dsr — Analytics: page past the 1000-row events cap

### Changed
- `GET /api/admin/analytics` fetched `analytics_events` with a single query, which
  PostgREST silently caps at 1000 rows. A 30-day window currently holds ~1699 events, so
  the cross-room aggregates (page views, unique visitors, active rooms, daily activity)
  were computed from only the first 1000 rows — undercounting every KPI by ~40%
  (measured: 61→37 page views, 15→9 unique visitors, 16→14 active rooms).
- Replaced the single query with a paginated `fetchAllEvents()` helper that ranges through
  the full result set (1000/page, ordered by `created_at`) and returns the same
  `{ data, error }` shape, so the surrounding error-surfacing and aggregation are unchanged.

### Files touched
- `src/app/api/admin/analytics/route.ts` — added `AnalyticsEventRow` type + `fetchAllEvents()`;
  swapped the inline events query in the `Promise.all` for the paginated call.

### Verified
- Confirmed against the live DB (read-only diagnostic): 1699 events in-window, single query
  returns exactly 1000; paginated fetch returns all 1699. Post-fix aggregates match the
  full-dataset numbers.
- `npm run build` + `npm run lint` — 0 errors (pre-existing warnings only).

### Notes
- This corrects an **undercount**, not the "all zeros" report. Investigation against the DB
  showed the events query never fails (380ms) and the dashboard should show real non-zero
  KPIs. The zeros a user sees are most likely the **internal-account exclusion**: 51% of
  in-window events (873 of 1699) come from 4 `@linkrunner.io` test accounts, and every
  analytics view hard-excludes them — so a room demoed only with an internal email shows
  all zeros on its per-room analytics. Whether to keep excluding internal traffic is a
  pending product decision, not changed here.
- The per-room route `api/rooms/[roomId]/analytics` has the same single-query pattern but is
  room-scoped (far less likely to exceed 1000); left as-is for now.
