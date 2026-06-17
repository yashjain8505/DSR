## 2026-06-17 - linkrunner-dsr — Favicon: adaptive dark/light mark

### Changed
- Recolored the favicon mark from brand purple to a neutral mark that adapts to
  the browser tab background:
  - `src/app/icon.svg` now carries a `<style>` block with a
    `prefers-color-scheme: dark` media query — dark mark (#2A2D34) on light tabs,
    white mark on dark tabs.
  - `src/app/icon.png` (96x96) and `src/app/apple-icon.png` (180x180, white bg)
    regenerated as the dark mark (static raster fallbacks).

### Files touched
- `src/app/icon.svg`, `src/app/icon.png`, `src/app/apple-icon.png`

### Verified
- Dev `/icon.svg` serves with the prefers-color-scheme media query; `icon.png`
  renders the dark mark with light faded bars.
- `npm run build` -> exit 0; `npm run lint` -> 0 errors.

### Notes
- Chrome's support for dark-mode SVG favicons can be inconsistent; the PNG
  fallback and light-tab default keep it sensible everywhere.
- Deployed to production.
