# OneWay room — fix broken hero logo

### Issue
- The `oneway` room rendered a broken-image placeholder for its logo.
- Root cause: the room (auto-generated 2026-07-07 11:23 UTC) had
  `logo_url = https://oneway.cab/apple-touch-icon.png`, but that path on
  OneWay's site serves an **HTML SPA fallback, not an image**, so the browser
  couldn't render it. The room was created before `oneway.cab` was added to
  `CURATED_LOGOS`, so it never picked up the good asset.

### Fix
- Updated `rooms.logo_url` for slug `oneway`:
  `https://oneway.cab/apple-touch-icon.png` →
  `https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/oneway.png`
  (the curated logo uploaded earlier; serves `200 image/png`).

### Files touched
- Supabase `rooms` row (slug `oneway`, `logo_url`) — data only, no code.
- `docs/changelog/2026-07-07-oneway-room-logo-fix.md` (this file)

### Notes
- Curated logo + `CURATED_LOGOS` entry were already in place, so future
  regenerations of this room stay correct; this only repaired the existing row.
- Browsers may cache the previously-broken image — a hard refresh shows the fix.
- Not changed: `brand_primary_color` is still the logo's yellow (`#ffe010`),
  which can wash out on the light room UI. Left as-is per scope.
