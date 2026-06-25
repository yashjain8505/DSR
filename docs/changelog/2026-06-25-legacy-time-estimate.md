# Capped legacy estimate for pre-upgrade "Time on Room"

After the accurate per-section tracker shipped, existing visitors showed 0s
(their only time data was the suppressed legacy wall-clock data). This adds a
conservative estimate so historical rows aren't blank, clearly marked approximate.

- `src/lib/analytics-format.ts`: `legacyEstimateSeconds` (longest single session
  per room, capped at 15 min, to avoid the old tracker's double-count and
  overnight inflation), `displayActiveTime` (accurate if present, else estimate),
  and `sectionBreakdown` (per-section when accurate, else a flagged whole-room
  estimate).
- `src/app/api/admin/analytics/route.ts`: per-visitor `active_seconds` falls back
  to the capped legacy estimate when there's no accurate data; adds
  `active_is_estimate`.
- `src/lib/types/index.ts`: `CrossRoomVisitorEntry.active_is_estimate`.
- `src/components/admin/analytics/visitor-table.tsx` +
  `visitor-activity-detail.tsx`: estimated times render with a `~` prefix and an
  "approximate, estimated from pre-upgrade data" tooltip.

Accurate per-section time replaces the estimate automatically once a visitor
returns after the upgrade.
