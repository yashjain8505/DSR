## 2026-07-16 - linkrunner-dsr — Commit leftover helper scripts + mockups

### Added (were sitting untracked in the working tree)
- `scripts/granola/sync-cache-from-local.js` — offline Granola sync: reads locally-saved
  transcripts and upserts them into `granola_meeting_cache` (the public Granola API returns
  `403 SUBSCRIPTION_INACTIVE`). Idempotent on `granola_meeting_id`; preserves curated `company_name`.
- `scripts/granola/create-fino-room.ts` — one-off `tsx` seeder that created the Fino Pay room
  with the curated logo set directly (mirrors `from-granola` child-row seeding).
- `scripts/_tmp-khelo2.js` — throwaway logo-fetch/resize helper (KheloMore app icon → PNG).
- `mockups/features-page.html`, `mockups/option4-final.html` — static marketing-page mockups.

### Files touched
- The five files above + this changelog.

### Verified
- Scanned all five for hardcoded secrets (`gsk_`, `sk-`, JWT/`eyJ`, `service_role`, bearer tokens): none — the scripts load credentials from `.env.local` at runtime.
- `.claude/settings.local.json` was intentionally **not** committed (gitignored, local-only).

### Notes
- No application/runtime code changed; these are dev-only helpers and static mockups.
