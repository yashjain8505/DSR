## 2026-07-29 - linkrunner-dsr — Affordplan: real logo + green primary

### Changed
- `/room/affordplan` logo: favicon → the supplied "ap" monogram, mirrored into the `assets` bucket (`logos/affordplan.png`).
- `brand_primary_color` `#204090` (a mismatched blue) → **`#13a052`** (the logo's green, 100% of its saturated pixels); `brand_secondary_color` `#15803d` → `null` (the second logo colour is a neutral charcoal, not a distinct hue).

### Notes
- The supplied asset had the "ap" mark inside a **dashed safe-area guide ring** with heavy padding. A plain trim wouldn't remove the ring (it reaches near the edges), so the logo was masked — keeping only the charcoal + green "ap" pixels and dropping white and the light-gray ring — then trimmed on transparency (600x300 → 256x198). Result: a clean transparent "ap" with no ring.

### Files touched
- `docs/changelog/2026-07-29-affordplan-logo.md` (this file)
- Supabase data otherwise — one `rooms` row; plus `assets/logos/affordplan.png` in storage.

### Verified
- `GET /room/affordplan` 200; cleaned logo eyeballed (charcoal "a" + green "p", ring removed, transparent).
