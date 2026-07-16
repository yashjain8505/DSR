## 2026-07-07 - linkrunner-dsr — Granola sync: 8 missing meetings backfilled via MCP connector

### Changed
- Synced 8 Granola meetings that were absent from `granola_meeting_cache` into the table (28 → 36 rows). After this, all 26 meetings in Granola's last-30-day window (Jun 10 → Jul 7) are cached. New rows:
  - Jul 7 — PayMe India (Vaibhav Tripathi) — `5c6f2526…`
  - Jul 6 — RentenPe (Rishabh Jain) — `7789e1ed…` *(no summary in Granola yet — cached with empty summary)*
  - Jun 19 — Qatobit (Rudra) — `e57bab62…`
  - Jun 17 — RupeeRedee (Aditya Agarwal) — `a3f9eb9a…`
  - Jun 11 — Scripbox (Arpit Uppal) — `87be7204…`
  - Jun 11 — GoDigit (Chetan Verma) — `16796c48…`
  - Jun 10 — Sid's Farm (Manisha Kar) — `02db3d1f…`
  - Jun 10 — Bigul (Himanshu Masurkar) — `2e3f8dfb…`

### How
- The public API (`public-api.granola.ai`, used by `scripts/granola/sync-cache.js`) still returns `403 SUBSCRIPTION_INACTIVE`, so this sync sourced meeting content from the **Granola MCP connector** (`get_meetings` → AI summary + attendees), same approach as the 2026-06-11 sync. Rows were upserted with the exact `sync-cache.js` shape (`onConflict: granola_meeting_id`, curated `company_name` preserved).
- Company names set to real brand names to match cache convention (not the auto-derived domain label, e.g. `godigit` → "GoDigit", `sidsfarm` → "Sid's Farm").

### Follow-up sync (same day)
- One additional meeting appeared in Granola after the backfill and was synced the same way (36 → 37 rows): Jul 7 — OneWay (Vivek, `oneway.cab`) — `60a1231f…`. All 27 last-30-day Granola meetings are now cached.
- Rishabh/RentenPe (`7789e1ed…`) still has no summary in Granola; its row stays summary-empty until Granola generates notes.

### Files touched
- None in the repo — Supabase data only (`granola_meeting_cache`). A temp upsert runner was created and removed; meeting content was staged in `/tmp` (never committed).
- `docs/changelog/2026-07-07-granola-sync-mcp-backfill.md` (this file)

### Notes
- The 8 new rows have `meeting_brief = NULL` and no prospect room yet. Run `scripts/granola/populate-briefs.js` (briefs) and `scripts/granola/seed-rooms-from-moms.js` (rooms) if these prospects need rooms — not done here, as this task was just the cache sync.
- `summary` holds Granola's AI summary, not the verbatim transcript (transcripts remain gated behind the inactive paid subscription).
