## 2026-07-29 - linkrunner-dsr — Fuaark: real logo + navy primary

### Changed
- `/room/fuaark` logo: 128px Google favicon → the supplied navy "F" swoosh mark (512x512 transparent PNG), trimmed of its transparent padding (mark was ~24% of the canvas → 247x256) and mirrored into the `assets` bucket (`logos/fuaark.png`).
- `brand_primary_color` `#004060` → `#002e53` (sampled from the logo — 99.6% of its saturated pixels).

### Files touched
- `docs/changelog/2026-07-29-fuaark-logo.md` (this file)
- Supabase data otherwise — one `rooms` row; plus `assets/logos/fuaark.png` in storage.

### Verified
- `GET /room/fuaark` 200; trimmed logo downloaded back and eyeballed (navy swoosh, clean transparent crop).
