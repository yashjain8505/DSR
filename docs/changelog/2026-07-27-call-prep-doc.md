## 2026-07-27 - linkrunner-dsr — Pre-call prep doc from calendar (iCal) + DSR room activity

### Added
A Slack "prep doc" posted ~30 min before a scheduled call: it matches a calendar attendee to their DSR room and summarizes what they did in it (time by section, actions), so the rep walks in briefed.

- **Calendar source = secret iCal feed** (`CALENDAR_ICS_URL`), not Google OAuth — the user chose the lighter setup (one URL, no Google Cloud project). `src/lib/calendar-ics.ts`: hand-rolled RFC5545 parser (line unfolding, VEVENT extraction, ATTENDEE mailto emails, STATUS filter). Timezone: `Z` values are UTC; `TZID` values use the feed's `VTIMEZONE`/`TZOFFSETTO`; floating times fall back to `CALENDAR_DEFAULT_TZ_OFFSET_MIN` (default 330 = IST). Exact for non-DST zones like IST; documented ±1h risk near DST transitions in other zones.
- **Email → room matching** (`src/lib/call-prep.ts` `findRoomForEmail`): prefers a room the visitor has actually opened (`room_visits`), else an exact/`@domain`/bare-domain hit in `room_access`, else a `rooms.contact_email` match. Reuses `domainFromEmail`.
- **Prep-doc body** (`buildPrepDoc`): pulls the visitor's `analytics_events` for that room and runs them through the existing `analytics-format` helpers (`sectionBreakdown`, `describeActivityEvent`, `displayActiveTime`, `formatDuration`). Reports "hasn't opened the room yet" when matched but no activity.
- **Slack:** `sendCallPrepDoc` in `src/lib/slack.ts` (respects `@mention` prefix + `[TEST]` tag).
- **Cron:** `src/app/api/cron/call-prep/route.ts` — CRON_SECRET GET + admin POST + `?test=1`. Fires for meetings starting in the 25–35 min window; `call_prep_log` (migration `013`, apply by hand) dedups to one prep per calendar event. Test runs skip the dedup insert so a real run still fires.

### Scheduling
Vercel Hobby caps cron at daily, so `/api/cron/call-prep` runs off the same external ~5-min scheduler as `/api/cron/sessions` (Supabase `pg_cron`/`pg_net`, or cron-job.org). Not added to `vercel.json` (a daily run would miss most 30-min windows).

### Files
- `src/lib/calendar-ics.ts`, `src/lib/call-prep.ts`, `src/app/api/cron/call-prep/route.ts` (new)
- `src/lib/slack.ts` (`sendCallPrepDoc`), `.env.example` (`CALENDAR_ICS_URL`, `CALENDAR_DEFAULT_TZ_OFFSET_MIN`)
- `supabase/migrations/013_call_prep_log.sql` (new — apply by hand)
- `docs/changelog/2026-07-27-call-prep-doc.md` (this file)

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles (`/api/cron/call-prep` present); `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- **Not yet run against a real calendar** — needs `CALENDAR_ICS_URL` set, migration 013 applied, and the endpoint on the 5-min scheduler. The admin `POST ?test=1` triggers a labelled test run.

### Note
- Google's secret iCal feed can lag a few minutes to ~an hour, so this fits calls scheduled a bit ahead (i.e. follow-ups) rather than meetings created minutes before they start. If real-time detection is ever needed, swap `calendar-ics.ts` for a Google Calendar API reader behind the same `fetchUpcomingEvents` interface — the rest is source-agnostic.
