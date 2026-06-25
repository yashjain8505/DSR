# Per-section engaged time + unified visitor drilldown

## The bug
Historical `time_on_tab` events came from the old wall-clock tracker (logged
total time since mount on every tab switch, including idle/overnight). They were
inflated (top values ~56,000s ≈ 15.7h) and double-counted, producing "18h" times.
They also can't be attributed to a section.

## The fix (non-destructive)
- The tracker now stamps each accurate, idle-excluded time event with `v: 2` and
  attributes it to the section currently in view (`tab: <sectionKey>`), found by
  the section at the viewport centre (`src/components/room/analytics-tracker.tsx`).
- `src/lib/analytics-format.ts` (new): shared helpers. `isReliableTimeEvent`
  counts only `v >= 2` events, so legacy wall-clock events are ignored in every
  total and breakdown — existing rooms instantly stop showing 18h, and no data is
  deleted. Also `aggregateSectionTime` (time by section), `formatDuration`,
  `describeActivityEvent`.
- `src/app/api/admin/analytics/route.ts`: per-visitor `active_seconds` now counts
  only reliable events.

## Same deep drilldown everywhere
- `src/components/admin/analytics/visitor-activity-detail.tsx` (new): one shared
  drilldown showing total engaged time, a "time by section" breakdown (exactly
  where the minutes went), and a clean activity timeline (discrete actions only;
  per-flush time events are rolled into the breakdown, not listed).
- Used by both the per-room analytics page
  (`src/app/(admin)/admin/rooms/[roomId]/analytics/page.tsx`) and the global
  admin dashboard visitor table
  (`src/components/admin/analytics/visitor-table.tsx`), so they're identical.

No migration. Legacy time events are retained in the DB but ignored; they can be
hard-deleted later if desired.
