## 2026-06-11 - linkrunner-dsr — Granola sync: cache updated via MCP, sync route fixed to use real public API

### Changed
- Synced 2 new Granola meetings into `granola_meeting_cache` (now 31 rows): "Linkrunner <> Chetan || Intro call" (GoDigit, 2026-06-11) and "Linkrunner <> Manisha Kar || Intro call" (Sid's Farm, 2026-06-10). Synced with AI summaries, not transcripts (see Notes).
- Fixed `POST /api/granola/sync`: it pointed at `https://api.granola.ai/v1/meetings`, which does not exist (404 — verified by probe). Now uses the real public API `https://public-api.granola.ai/v1/notes` with cursor pagination, `created_after` filter, `?include=transcript` per-note transcript fetch, and the `people`/`created_at` field names that API actually returns (matching `scripts/granola/fetch-transcripts.ts`, which has worked against this API before).
- Added `scripts/granola/sync-cache.js` — local equivalent of the sync route (list notes → fetch transcripts → upsert cache), same `.env.local`-loading pattern as the other scripts.

### Files touched
- `src/app/api/granola/sync/route.ts`
- `scripts/granola/sync-cache.js` (new)
- `docs/changelog/2026-06-11-granola-sync-route-fix.md` (this file)

### Verified
- `npm run build` passes.
- `npm run lint`: route change is clean; `sync-cache.js` has the same 3 `no-require-imports` errors every existing script in `scripts/` already has (pre-existing baseline, 40 errors before and after).
- Could NOT verify the route end-to-end against Granola: the API key returns 403 `SUBSCRIPTION_INACTIVE` ("Workspace subscription is not active"). The route fix is correct per the known-working fetch script, but stays unverifiable until the Granola workspace subscription is renewed.

### Notes
- **Granola workspace subscription is inactive.** Both the public API (403 on every call) and MCP transcript access ("Transcripts are only available to paid Granola tiers") are blocked. Today's sync therefore used meeting summaries from the Granola MCP integration, not verbatim transcripts. Once the subscription is renewed, run `node scripts/granola/sync-cache.js` (or the admin sync button) to backfill transcripts — the upsert overwrites `summary` with the transcript, as the route always intended.
- Company names set manually to match cache convention (real brand names, not title fragments): "GoDigit", "Sid's Farm".
