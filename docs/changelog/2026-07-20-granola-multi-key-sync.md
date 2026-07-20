## 2026-07-20 - linkrunner-dsr — Granola sync: per-rep personal keys, internal-meeting filter, nightly cron

### Changed
- `POST /api/granola/sync` now syncs across **multiple Granola personal API keys** — one per rep — instead of a single workspace-wide key. Keys come from `GRANOLA_API_KEYS` (comma-separated, `label:key` form); `GRANOLA_API_KEY` still works as a single-key fallback. Rationale: a personal key sees that rep's own notes, so meetings reach the DSR with **no per-meeting "add to folder" step** by the rep. Granola has no rule-based auto-share, so the shared-folder alternative would have required manual filing of every non-recurring call.
- **Added a content gate (`classifyMeeting`).** The key's notes scope exposes *everything* its owner records — internal 1:1s, standups, personal appointments. Only meetings with at least one external (non-`@linkrunner.io`, non-creator) participant are upserted; the rest are dropped before any database write. Free-email domains are deliberately allowed through, since a prospect on gmail is still a prospect.
- **`no_participants` is reported separately from `internal_only`.** Granola populates attendees from the calendar event, so a note with *no* attendees almost always means the recorder's calendar isn't shared with the Granola account — a setup problem, not an internal meeting. Folding the two together would let a broken calendar look like a quiet, successful sync. Both counts plus a `skipped[]` list of titles+reasons are returned by the API and surfaced in the admin panel's status line.
- **Per-key error isolation.** Each key is listed independently; one revoked/unsubscribed key degrades to a warning in the `keys[]` response field instead of failing the run. If *every* key fails, the route returns 502 rather than a misleading `synced: 0`.
- **Dedupe across keys** by `granola_meeting_id` (two reps on the same call), first key to see a note also fetches its transcript.
- **Added `?dryRun=1`** to the manual sync: reports what *would* be written (title, date, derived `company_name`/`contact_email`, participant count, insert-vs-update) and writes nothing. Meeting content is deliberately excluded from the preview. Exists because a personal key exposes every note its owner records, so the internal/external split should be eyeballed once before the first real write.
- **Added `GET /api/granola/sync` for Vercel Cron**, authenticated by `CRON_SECRET` as a bearer token (timing-safe compare, matching the `lib/auth.ts` idiom). This is the only Granola handler not gated by `requireAdmin()` — intentionally, since cron has no session cookie. New `vercel.json` schedules it daily at 03:00 UTC.
- Added a one-retry-on-429 to `listNotes` and 250ms pacing between key/transcript batches, so unattended runs don't trip rate limits.
- **Fixed stale error handling** in `granola-meetings-panel.tsx`. It previously claimed *"Granola only works via MCP"* and told the user to ask Claude Code to sync — untrue since the 2026-06-11 fix, and it swallowed 403s into a dead end. Replaced with `explainSyncError`, which maps `SUBSCRIPTION_INACTIVE` / `INVALID_API_KEY` / missing-config to actionable messages. The success message now also reports `skipped_internal` and any failed keys, so a zero-result sync never looks like a silent no-op.

### Files touched
- `src/app/api/granola/sync/route.ts`
- `src/components/admin/granola-meetings-panel.tsx`
- `vercel.json` (new)
- `.env.example` (`GRANOLA_API_KEYS`, `CRON_SECRET`)
- `docs/changelog/2026-07-20-granola-multi-key-sync.md` (this file)

### Verified
- `npm run build` passes.
- `npm run lint`: 0 errors, 58 warnings. The sync route is clean; the two warnings in `granola-meetings-panel.tsx` (unused `router` at :58, setState-in-effect at :619) are pre-existing and untouched by this change.
- **NOT verified end-to-end against Granola** — see Notes. No working key was available.

### Notes
- **Still blocked on Granola configuration.** The MCP-connected account (`tools@linkrunner.io`, workspace "Tools@linkrunner") returns **0 meetings** for May 1 – Jul 20, and both shared folders ("Team meetings", "Customer calls") are at `note_count: 0`. The team's real meetings live in a different workspace. Whatever key `GRANOLA_API_KEY` currently holds was returning `403 SUBSCRIPTION_INACTIVE` as of 2026-07-07.
- **API keys of any type require a Business/Enterprise workspace seat.** Granola's current lineup is Basic (free) / Business / Enterprise — there is no "Pro" tier anymore, and subscriptions are per-*workspace*, not per-user. Switching to personal keys does not dodge this: every rep needs a seat on a subscribed workspace.
- **Open question for Granola support:** whether a *trial* satisfies the API's subscription check. Their billing doc says a trial grants "full access to that plan", but no doc states the API accepts a `trialing` subscription, and `SUBSCRIPTION_INACTIVE` appears in no official documentation at all (the OpenAPI spec documents only 400/401/404). The observed 403 suggests trials may not qualify.
- **Granola has no API webhooks** ("Not yet… on our roadmap"), so polling via cron is currently the only unattended path. Zapier's "Note Added to Granola Folder" trigger is real push with a full payload including transcript, but it is folder-scoped and would reintroduce the manual filing step this change exists to avoid.
- `maxDuration` is 60s (safe on both Hobby and Pro). With many keys over a 90-day window this could get tight; if it times out, raise it (Pro allows 300) or narrow the window.
- Vercel **Hobby caps cron at daily frequency** — hence 03:00 UTC daily. On Pro, tighten the `vercel.json` schedule (e.g. `0 */6 * * *`).
- `CRON_SECRET` and `GRANOLA_API_KEYS` must be added in Vercel project settings or production breaks.
