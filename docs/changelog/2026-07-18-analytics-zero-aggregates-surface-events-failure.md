## 2026-07-18 - linkrunner-dsr — Stop analytics dashboard silently showing zero aggregates when the events query fails

### Changed
The admin analytics dashboard (`/admin/analytics`) showed zero/empty KPIs, room
funnels, and daily-activity while the Visitor Activity table on the same page
was full of real external visitors (last active 7-14 days ago).

Root cause: **every aggregate is derived solely from the `analytics_events`
query, whose result was masked with `?? []`.** `room_visits.last_visited_at` is
only ever written alongside an analytics event (email-gate submit and the
per-event tracker both do so), so a visitor "last active" 7-14 days ago *must*
have events inside the default 30-day window. Aggregates being zero therefore
means the events query returned nothing — i.e. it silently failed (most likely a
statement timeout on the unbounded, cross-room `analytics_events` scan that is
filtered only by `created_at` and cannot use the `(room_id, created_at)` index)
— and `?? []` turned that failure into a fake "no traffic" dashboard. The
smaller `room_visits`/`visitors` queries kept succeeding, so the visitor table
still populated. This was **not** the date-window default (30 already covers
7-14-day-old traffic) and **not** the `@linkrunner.io` exclusion (external
visitors survive it).

The route now logs every failed sub-query and returns an `aggregate_error`
string when the events query fails, instead of masking it. The dashboard shows
an amber banner explaining the aggregate numbers are unreliable, while keeping
the (still-valid) visitor table rendered.

### Files touched
- `src/app/api/admin/analytics/route.ts` — log each sub-query's `.error`; add
  `aggregate_error` to the response instead of silently `?? []`-masking the
  events-query failure.
- `src/lib/types/index.ts` — add `aggregate_error: string | null` to
  `CrossRoomAnalytics`.
- `src/app/(admin)/admin/analytics/page.tsx` — render an amber banner when
  `aggregate_error` is set; visitor table still renders.

### Verified
- `npx tsc --noEmit` → clean (exit 0).
- Did not run build/dev (concurrent-build rule).

### Notes
- This surfaces the failure; it does not by itself make a timing-out events
  query succeed again. To actually restore aggregates when the table is large,
  add an index on `analytics_events(created_at)` (or move the cross-room
  aggregation into a SQL function/RPC) — a hand-applied migration, out of scope
  for this change per the task constraints.
- The Vercel logs will now show the real Postgres error (`[admin/analytics]
  events query failed: ...`) to confirm whether it is a statement timeout.
