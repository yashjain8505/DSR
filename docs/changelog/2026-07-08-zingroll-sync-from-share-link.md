# Zingroll — synced from Lakshith's shared Granola note

### Changed
- Synced "Linkrunner <> Zingroll" (Jul 8, 2026) into `granola_meeting_cache`
  (`granola_meeting_id = d021d298-427f-4b13-a3b3-243f80085d1a`, company `Zingroll`).

### How (why not the connector)
- This note was authored by Lakshith and shared with Yash. The Granola MCP
  connector is authed as `yash@linkrunner.io` and only surfaces Yash's own
  notes, so it didn't appear in `list_meetings`/`query_granola_meetings`, and
  `get_meetings` returned `not_found`. Folder / "shared with me" access is
  paid-gated ("Meeting folders are only available to paid Granola tiers").
- Lakshith provided the public share link. Content was extracted from the
  shared page's embedded note payload (title, date, and the full structured
  summary) and upserted with the same row shape as the other syncs.

### Fields
- `contact_email` is null — the shared page exposes only the note author
  (Lakshith); no Zingroll participant email was available. Domain is
  `zingroll.com` (from `app.zingroll.com` in the notes).
- `participants` lists only Lakshith (creator); Zingroll attendees weren't
  enumerated on the shared page.
- `meeting_date` stored as Jul 8 12:00 IST (exact time not in the share
  metadata, which only carried the date).

### Files touched
- Supabase `granola_meeting_cache` (one new row) — data only, no code.
- `docs/changelog/2026-07-08-zingroll-sync-from-share-link.md` (this file)

### Notes
- No `meeting_brief` and no room yet, same as other freshly-synced meetings.
