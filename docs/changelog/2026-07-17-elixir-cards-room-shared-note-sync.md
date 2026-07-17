## 2026-07-17 - linkrunner-dsr — Elixir Cards room + syncing Granola notes shared by a teammate

### Changed
- Synced the 2026-07-17 "Linkrunner Intro call between Shreyans and Ritik Madan" meeting
  (Elixir Cards) into `granola_meeting_cache`, then set the room's curated logo, brand
  color and transcript-derived brief on `/room/elixir-cards`.
- The room itself already existed (created via the normal admin Meetings → from-granola
  flow, `contact_name: "Ritik Madan, Rishik"`); the script took its update branch and
  replaced the domain-guessed logo with the user-supplied one. All child rows intact
  (overview_sub_tabs 7, customer_references 17, case_studies 7, pricing/getting_started/
  meeting_briefs 1 each).
- Brand colors: `brand_primary_color: #d33911`, `brand_secondary_color: null`. The logo is
  single-hue (every saturated bucket sits at hue ~12°), so null matches what
  `extractBrandAssets()` returns when no second hue is distinct.

### How to sync a note a teammate shared with you (this was undocumented)
The Granola **API path is dead** — `sync-cache.js` / `POST /api/granola/sync` return
`403 SUBSCRIPTION_INACTIVE`, and the MCP connector is tier-gated
("transcripts are only available to paid Granola tiers"). The MCP is also scoped to
`yash@linkrunner.io`'s own workspace, so **meetings run by a teammate are invisible to
every tool** — they cannot be enumerated, only reached via a share link.

Given a `https://notes.granola.ai/t/<token>` link:
1. It 302-redirects to `/d/<real-doc-id>` — that is how you recover the true document id
   (the `/t/` UUID is a share token; `get_meetings` returns `not_found` for it).
2. `/d/<id>` is public and returns 200 to a normal browser. **WebFetch is 403'd by
   user-agent** on both URLs, which is misleading — the page is not access-gated.
3. The page only server-renders metadata (title, date, attendees, an `og:description`
   teaser). The **body is client-rendered, so the transcript still has to be pasted in**
   by a human. This is not yet automatable without the Chrome extension.
4. Build `scripts/granola/transcripts/_manual-<slug>.json` (an array of
   `{id, title, date, participants, transcript}`) and run
   `node scripts/granola/sync-cache-from-local.js --file <path>`.
   Use the **real** doc id as `id` so the upsert stays idempotent (the earlier
   `_manual-ritika-finopay.json` used a synthetic `local-…` id only because the real one
   was not known).

`extractCompanyName()` reads `company` off the first non-creator, non-@linkrunner.io
participant, so set it there (`Elixir Cards`) — the title has no `<> X ||` token to fall
back on.

### Files touched
- `scripts/granola/create-elixir-room.ts` (new) — uploads the curated logo to
  `assets/logos/`, generates the brief from the cached transcript via Groq, creates/updates
  the room. Mirrors `create-fino-room.ts`, but that one assumes the logo is already in
  storage and `meeting_brief` is already on the cache row; neither holds for a
  transcript-only row synced from a shared note.
- `scripts/granola/transcripts/_manual-elixir-ritik-2026-07-17.json` (new, gitignored).

### Verified
- `node scripts/granola/sync-cache-from-local.js --file …` → `Elixir Cards <- Linkrunner
  Intro call between Shreyans and Ritik Madan`.
- `npx tsx scripts/granola/create-elixir-room.ts` run twice — idempotent (second run
  reused the cached brief and re-reported identical room state).
- `git check-ignore` confirms the transcript JSON is ignored (`.gitignore:46`).

### Notes
- **`tsx` is not installed and is not a dependency**, so the `npx --no-install tsx` header
  on `create-fino-room.ts` (and the sibling scripts) fails. Use `npx --yes tsx`. Native
  `node` type-stripping does not work either: `src/lib/brief-from-transcript.ts` imports
  `./meeting-brief` extensionlessly, which Node's ESM resolver rejects.
- `AGENTS.md` still presents `GRANOLA_API_KEY` as a working path for transcript fetching.
  It has not worked since ~2026-05-28. `scripts/granola/transcripts/_all_transcripts.json`
  is a frozen snapshot (18 records, May 8–27) — `sync-cache-from-local.js` was written as
  the post-lapse workaround and is the only intake that still functions.
- The Granola desktop app's local cache is **encrypted as of v6** (`cache-v6.json.enc`,
  encrypted `granola.db`); the plaintext `cache-v6.json` is an empty shell. Any older
  "read the local cache" approach is gone.
- `contact_email` is null on both the cache row and the room — no prospect email was
  shared on the call. Set it in the admin Meetings tab if the ideation engine needs it.
- Not committed or pushed; no build/lint run, as nothing under `src/` changed.
