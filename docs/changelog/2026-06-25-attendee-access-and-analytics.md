# Auto-grant attendee access + analytics accuracy + brief grounding

Four related changes from the same request.

## 1. Auto-grant room access to meeting attendees
`src/app/api/rooms/from-granola/route.ts`
- When a room is created from a Granola meeting, every external attendee's email
  (from `participants`, excluding @linkrunner.io and the note creator) is now
  collected and inserted into `room_access`.
- The room is created with `restrict_access = true` (only when there is at least
  one attendee to admit), so meeting-created rooms are private to their attendees
  plus the Linkrunner team. No more adding emails by hand. Existing rooms are
  unchanged (new rooms only).

## 2. Meeting-brief generator grounding
`src/app/api/rooms/from-granola/route.ts`
- Tightened `CUSTOMER_POV_SYSTEM_PROMPT`: use ONLY facts present in the source,
  never invent/infer/generalize, omit sections with no real content, and keep all
  names/numbers/integrations exactly. Reduces the "Your Situation" / "What We
  Showed You" inaccuracies.

## 3. Active-time tracking (idle excluded)
`src/components/room/analytics-tracker.tsx`
- Rewrote the tracker so `time_on_tab` only accrues while the tab is visible AND
  the visitor interacted within the last 30s. Idle/backgrounded time no longer
  inflates the number. Time is flushed every 20s (and on hide/unload) as deltas,
  so a visitor's events sum to their true engaged time.

## 4. Analytics: drilldown, active time, exclude internal
- `src/app/api/admin/analytics/route.ts` + `src/app/api/rooms/[roomId]/analytics/route.ts`:
  exclude all `@linkrunner.io` visitors (internal testing) from every metric and
  the visitor list. Added per-visitor `active_seconds` and `visitor_id`.
- `src/app/api/admin/analytics/visitors/[visitorId]/route.ts` (new): cross-room
  activity timeline + total active time for one visitor.
- `src/components/admin/analytics/visitor-table.tsx`: each visitor row is now
  expandable (drilldown shows engaged time, per-room breakdown, and an activity
  timeline) and a new "Time on Room" column shows active time.
- `src/lib/types/index.ts`: `CrossRoomVisitorEntry` gains `visitor_id` +
  `active_seconds`; added `VisitorTimeline` / `VisitorTimelineEvent`.

No DB migration required — all changes use existing tables/columns.
