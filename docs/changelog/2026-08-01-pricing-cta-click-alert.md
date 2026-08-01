## 2026-08-01 - linkrunner-dsr — Pricing CTA click → real-time Slack alert

### Added
- **`POST /api/analytics/cta-click`** (new, public) — a prospect clicking the Pricing tab's
  *"Book a demo call for a custom quote"* now records a `link_click` analytics event **and**
  posts a Slack ping to the same `#crm-alerts` channel as the sign-in/sign-out pings.
- **`sendCtaClickAlert`** in `src/lib/slack.ts` — one line, mirroring the sign-in/sign-out
  format, plus a context line naming the room:
  > :fire: *Rahul from RNFI Services clicked "Book a demo call for a custom quote"*
  > 1 Aug 2026, 10:51 am
  > _Pricing tab · room: rnfiservices_

### Why it alerts inline instead of from the session cron
Sign-in/sign-out **have** to be reconstructed after the fact by `/api/cron/sessions` — there
is no "sign-out" event to hang an alert on, only an inferred idle gap. A CTA click is a
discrete event and the strongest buying signal the room produces, so it fires from the click
itself. That also means it does **not** depend on the external cron-job.org scheduler: the
ping lands in seconds, and it still works if that scheduler is down.

### Reused rather than rebuilt
- **Event type is the existing `link_click`**, with `event_data = { cta, label, url, tab }`.
  `describeActivityEvent` (`analytics-format.ts:179`) already renders `Clicked "<label>"`
  from `event_data.label`, and `link_click` is already a counted series in the admin daily
  activity chart and aggregation. So the click shows up in the visitor timeline and the
  chart with **zero admin-side changes**.
- **No migration.** Dedup reads `analytics_events` itself instead of adding a ledger table
  (`visitor_sessions` exists for the session cron because sessions have no natural row;
  clicks do). Nothing to apply by hand in the SQL editor.
- **No new env var** — reuses `SLACK_DSR_ACTIVITY_WEBHOOK_URL` (falling back to
  `SLACK_WEBHOOK_URL`), same as every other activity alert.

### The route is public — three things stop it being a Slack-spam vector
It has to be public, like `/api/analytics`: prospects are unauthenticated.
1. **The alert text never comes from the request body.** The client posts only a CTA *key*;
   the server looks the label up in `TRACKED_CTAS` (`constants.ts`) and rejects unknown keys
   with a 400. Without this, anyone could POST `<!channel>` — or any text at all — straight
   into the alerts channel. This is the important one.
2. **`visitor_id` must resolve to a real `visitors` row** (and `room_id` to a real room —
   both are FK-enforced). Unknown visitors are recorded but never announced.
3. **Repeat clicks collapse**: one alert per visitor per room per `DEDUP_MIN` (30 min).
Internal `@linkrunner.io` visitors are excluded, matching the session cron and the dashboard.

### Race-safe dedup, without a lock
The click row is inserted **first**, then the dedup query counts only clicks *strictly older*
than that row's `created_at`. Two racing clicks therefore resolve deterministically — the
earlier row sees no prior click and alerts, the later one sees it and stays quiet. Checking
before the insert would let both race through and double-post; counting all rows in the
window would silence both.

### Changed
- `src/lib/constants.ts` — added `TRACKED_CTAS` / `TrackedCtaKey`. The button label now comes
  from here, so the rendered text and the Slack message cannot drift apart.
- `src/components/room/tab-pricing.tsx` — takes `roomId` + `visitorId`; the CTA anchor gets an
  `onClick` that fires the post (`keepalive`, `.catch()` swallowed — analytics must never
  block the booking link). Label sourced from `TRACKED_CTAS`.
- `src/components/room/room-tabs.tsx` — passes `roomId` / `visitorId` into `TabPricing`.

### Files touched
- `src/app/api/analytics/cta-click/route.ts` (new)
- `src/lib/slack.ts` · `src/lib/constants.ts` · `src/components/room/tab-pricing.tsx` ·
  `src/components/room/room-tabs.tsx`
- `docs/changelog/2026-08-01-pricing-cta-click-alert.md` (this file)

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles with `/api/analytics/cta-click` present
  in the route manifest; `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- **Route exercised locally against all four paths**, with `SLACK_DSR_ACTIVITY_WEBHOOK_URL`
  pointed at a local sink so the exact Block Kit payload could be inspected (neither Slack
  webhook is set in `.env.local`, so a real post would have been silently skipped):
  | case | response | Slack payloads |
  |---|---|---|
  | external visitor, 1st click | `{success:true, alerted:true}` | 1 |
  | same visitor, immediate 2nd click | `{success:true, alerted:false}` | 0 (deduped) |
  | `@linkrunner.io` visitor | `{success:true, alerted:false}` | 0 (excluded) |
  | `cta: "<!channel> pwned"` | `400` | 0 (rejected pre-insert) |
- Captured payload rendered correctly, `[TEST]`-tagged via `?test=1`.
- All three clicks were confirmed written to `analytics_events` with the `label` field
  `describeActivityEvent` needs — i.e. the event is always recorded even when the alert is
  suppressed. **The 3 synthetic events were then deleted** from the (real) Kredit.Pe room;
  re-queried after cleanup: 0 `link_click` rows remain.
- **Client wiring verified in the shipped bundle, not by grepping the page HTML** — the room's
  tab bodies are client-rendered, so an HTML grep for the button would have returned 0
  whether or not the code worked (the vacuous-grep trap from `2026-07-20-set-room-brand-tool`).
  The compiled chunk shows `onClick` bound to the CTA anchor beside `href:g.DEMO_CALL_URL`,
  posting `{room_id, visitor_id, cta:"pricing_demo_call"}` with `keepalive:!0`.
### Confirmed in production (2026-08-01, post-deploy)
- **Slack delivery:** a `?test=1` click against `dsr.linkrunner.io` returned
  `{"success":true,"alerted":true}` — `alerted` only goes true on a 2xx from the Slack
  webhook, so the message reached `#crm-alerts`. An immediate repeat returned
  `alerted:false`, confirming the 30-min dedup live. Both test rows were then deleted;
  `link_click` count across the whole table is back to 0.
- **The `onClick` fires** — the one thing the local browser pass could not prove. Yash
  clicked the CTA in the CredFlow room and it recorded cleanly:
  `05:58:00 yash@linkrunner.io link_click {"cta":"pricing_demo_call","tab":"pricing",…}`.
- **⚠️ You cannot self-test this by clicking.** That click produced no Slack message, which
  read as a bug and is not one: `@linkrunner.io` visitors are recorded but never announced
  (same exclusion as the session cron and the analytics dashboard). Reviewed and
  **deliberately kept** — the alert's whole value is that it only ever means "a prospect
  showed buying intent". To verify it by hand, POST to `/api/analytics/cta-click?test=1`
  with a non-internal `visitor_id`, or click through as a non-linkrunner email.

### Verification attempt that failed (local only)
- **Not verified by an actual browser click *locally*.** A real-browser pass was attempted and
  abandoned after the local environment failed three different ways, none of them related to
  this feature: (1) Turbopack panicked with `Next.js package not found` on the dev server —
  a `.next` directory left in production-build state; (2) after `rm -rf .next`, the dev
  server threw `ChunkLoadError` on its own HMR client chunk; (3) on a clean production build
  + `next start`, the room rendered server-side (`--brand-primary` present in the SSR output
  for every room tried) but never hydrated in the browser, leaving `loading.tsx` on screen.
  Also noted en route: `/room/kredit` has `restrict_access: true` with an `@kredit.pe`
  allowlist, so a test visitor is evicted by `/api/rooms/access-check` on load.
  This left exactly one unproven step — whether React's `onClick` fires on that anchor —
  which the production click above then settled. Recorded here because the three failure
  modes will recur for anyone trying to run this room locally.
- **No residue.** The browser attempts left 2 events (`page_view`, `tab_click`) under the
  `test@example.com` visitor; both deleted. Re-queried after cleanup: 0 events for that
  visitor, and 0 stray `link_click` rows anywhere in the window.

### Notes
- The floating **"Talk to us"** button (`talk-to-us.tsx`) opens the *same* `DEMO_CALL_URL` and
  is **not** tracked — only the Pricing tab CTA is, as asked. Adding it is a small change:
  give it a second `TRACKED_CTAS` entry and the same `onClick`.
- The "View pricing on our website" link on the same tab is likewise untracked.
- Nothing to set up: no migration, no env var, no scheduler. It is live as soon as this
  deploys, provided `SLACK_DSR_ACTIVITY_WEBHOOK_URL` is already set in Vercel (it is — the
  sign-in/out pings use it).
