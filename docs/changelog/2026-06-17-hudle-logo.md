## 2026-06-17 - linkrunner-dsr — Hudle room logo (hi-res, self-hosted)

### Changed
- The `hudle` room used a blurry logo: `extractLogo` fell back to Google's
  favicon API, which only returned a 32x32 image for hudle.in.
- Sourced the real 512px Hudle app icon ("Hudle: Find Sports Activities" by
  Hsquare Sports Private Limited, verified visually against the brand mark),
  normalized with sharp.
- **[data]** Uploaded to Supabase `assets/logos/hudle.png` and repointed
  `rooms.logo_url` for the `hudle` room (serves HTTP 200).
- **[code]** Added `hudle.in` to `CURATED_LOGOS` in `src/lib/brand-colors.ts`
  so the curated logo survives room regeneration.

### Files touched
- `src/lib/brand-colors.ts`

### Verified
- Logo URL returns 200 image/png; room `logo_url` updated; logo viewed to
  confirm correct company.
- `npm run build` -> exit 0; `npm run lint` -> 0 errors.

### Notes
- Same pattern as the KheloMore / Sid's Farm / R for Rabbit hi-res fixes.
