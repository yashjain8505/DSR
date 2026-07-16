# OneWay curated logo

- Hosted the official OneWay logo on Supabase (`assets/logos/oneway.png`),
  sourced from `oneway.cab`'s site icon (256×256 RGBA, the yellow-background
  blue concentric-"O" app icon). The site's `apple-touch-icon.png` is an SPA
  HTML fallback, so the real asset came from `favicon.ico` (256×256 PNG-in-ICO).
- Registered `oneway.cab` in `CURATED_LOGOS` (`src/lib/brand-colors.ts`) so it
  wins over auto-extraction and survives room regeneration.
- OneWay was synced into `granola_meeting_cache` earlier today (Jul 7 intro
  call, Vivek from oneway.cab); no prospect room exists yet, so this logo takes
  effect whenever a OneWay room is generated.

### Files touched
- `src/lib/brand-colors.ts` (added `oneway.cab` entry)
- Supabase `assets/logos/oneway.png` (uploaded)
- `docs/changelog/2026-07-07-oneway-logo.md` (this file)

### Verified
- Public URL returns `HTTP 200 image/png`.
- `npx eslint src/lib/brand-colors.ts`: 0 errors (only pre-existing unused-var warnings).
