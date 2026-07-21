## 2026-07-21 - linkrunner-dsr — Coutloot: primary brand colour neon-yellow → magenta

### Changed
- `/room/coutloot` primary brand colour `#f2ff1d` → **`#FF015B`** (via `set-room-brand.ts --slug coutloot --primary '#FF015B'`).

### Why
- The neon yellow made the "What is Linkrunner" tab's accents harsh, and the "Our Mission" card renders white text on `var(--brand-primary)` — white on `#f2ff1d` is ~1.07:1 contrast, effectively invisible.
- `#f2ff1d` is **not** an extraction artifact: it's genuinely in Coutloot's logo (the neon-yellow "C"). But the logo also carries a magenta arrow, `#FF015B` — pulled from the logo SVG's own `fill` values (`#F2FF1D`, `#FF015B`, plus a `#40DC06`→`#003E00` green gradient). Magenta is equally on-brand and white-on-magenta reads at ~3.9:1, so the mission card becomes legible.

### Notes
- Secondary left untouched: `--brand-secondary` is **set in `page.tsx:132` but read by no component** (`var(--brand-secondary)` appears nowhere in `src/`), so it has no visual effect today. Only `--brand-primary` (and its palette-derived light/dark variants) drives the accent.
- Logo unchanged — the stored SVG (`coutloot.com/assets/Group 1261156424.svg`) is fine; only the colour was wrong.

### Files touched
- `docs/changelog/2026-07-21-coutloot-brand-colour.md` (this file)
- Supabase data otherwise — one `rooms` row (`coutloot`).

### Verified
- `GET /room/coutloot` 200; `#FF015B` present in the rendered page, zero occurrences of `#f2ff1d`.
