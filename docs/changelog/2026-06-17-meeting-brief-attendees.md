## 2026-06-17 - linkrunner-dsr — Meeting brief: clean attendees (teams, no emails)

### Changed
- `src/lib/meeting-brief.ts`: replaced `stripLinkrunnerAttendees` with
  `cleanAttendees`, which drops email addresses and em/en dashes but KEEPS both
  teams. The snapshot now shows the prospect team AND the Linkrunner team
  (previously the Linkrunner team was stripped from the recap).
- `src/components/room/tab-meeting-brief.tsx`: the snapshot attendees render each
  "·"-separated group on its own line (e.g. "Team Hudle: ..." then
  "Team Linkrunner: ...").
- [data] Rewrote the Hudle room's brief: removed em dashes and participant
  emails, grouped attendees as "Team Hudle: <names> · Team Linkrunner: <names>",
  and restructured the body into canonical sections (Your Situation / Pain Points
  / What We Showed You) for cleaner, icon-led rendering.

### Files touched
- `src/lib/meeting-brief.ts`, `src/components/room/tab-meeting-brief.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0. Parse sim: both teams kept on separate
  lines, no emails/em-dashes, all 3 sections map to canonical headings.

### Notes
- The attendee change is global: other rooms' briefs now also show their
  Linkrunner attendees (with emails stripped), instead of hiding them.
