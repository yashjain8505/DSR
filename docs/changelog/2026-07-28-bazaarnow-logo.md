## 2026-07-28 - linkrunner-dsr — Bazaarnow: real logo + palette

### Changed
- `/room/bazaarnow` logo `bazaarnow.in/apple-touch-icon.png` → the supplied green→yellow gradient "b" tile, mirrored into the `assets` bucket (`logos/bazaarnow.png`).
- `brand_primary_color` `#60c060` → **`#50b86b`** (the logo's green end), `brand_secondary_color` `null` → `#eec918` (the gold end).

### Notes
- **Uploaded with `--no-trim`.** Unlike the earlier wordmark logos (a coloured mark on white, trimmed tight), this is a full-bleed square app-icon tile — the gradient fills the whole square with a white "b" mark. Trimming would find no uniform border and risk cropping the tile, so it's kept whole.
- Colours sampled from the logo: the gradient spans green (`#50b86b`/`#7ebc4d`) to gold (`#eec918`). Green chosen as primary because `--brand-primary` is used as text-on-white and as a white-text background — the gold would fail contrast there (the recurring yellow-primary trap). Gold recorded as secondary (currently unused by any component, so no visual effect — accurate brand data only).

### Files touched
- `docs/changelog/2026-07-28-bazaarnow-logo.md` (this file)
- Supabase data otherwise — one `rooms` row; plus `assets/logos/bazaarnow.png` in storage.

### Verified
- `GET /room/bazaarnow` 200; hosted logo URL and `#50b86b` present, old `bazaarnow.in/apple-touch` URL absent.
