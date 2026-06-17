## 2026-06-17 - linkrunner-dsr — Favicon: Linkrunner mark (was Vercel default)

### Changed
- The browser tab showed the default `create-next-app` (Vercel) favicon because
  `src/app/favicon.ico` was never replaced. Swapped it for the Linkrunner mark
  using Next App Router icon conventions:
  - Added `src/app/icon.svg` (brand mark, #4D4BF7) — primary favicon for modern
    browsers.
  - Added `src/app/icon.png` (96x96, transparent) — raster fallback.
  - Added `src/app/apple-icon.png` (180x180, white bg) — iOS home-screen icon.
  - Removed `src/app/favicon.ico` (the Vercel default) so it no longer overrides.

### Files touched
- `src/app/icon.svg` (new), `src/app/icon.png` (new), `src/app/apple-icon.png` (new)
- `src/app/favicon.ico` (removed)

### Verified
- Dev head emits `<link rel="icon" href="/icon.svg" type="image/svg+xml">` +
  png fallbacks; `/icon.svg` serves the mark.
- `npm run build` -> exit 0 (routes `/icon.svg`, `/icon.png`, `/apple-icon.png`);
  `npm run lint` -> 0 errors.

### Notes
- Needs a deploy to show on production / dsr.linkrunner.io.
