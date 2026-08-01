## 2026-07-31 - linkrunner-dsr — Kredit.Pe: real app-icon logo, logo-sampled green, display name

### Changed
- `company_name` `Kredit` → **`Kredit.Pe`**, matching the wordmark and the meeting
  transcript (`sudheer@kredit.pe`). Drives the hero greeting
  (`"Dear Rohit & Kredit.Pe team,"` — `contact_name` is `Rohit Kumar`, split to first names
  at `room-hero.tsx:52-61`), the header, and the email-gate title.
- `/room/kredit` `logo_url`: the hotlinked Google favicon fallback
  (`https://www.google.com/s2/favicons?domain=kredit.pe&sz=128`, 128px) → the supplied
  512x512 Kredit.Pe app icon, mirrored into the `assets` bucket (`logos/kredit.png`).
- `brand_primary_color` `#10c060` → **`#0d8863`**, sampled from the logo's green dot
  (mean of 4,733 interior pixels; modes cluster `#088660`–`#087c59`). The old value was a
  brighter, yellower green that never came from the mark.
- `brand_secondary_color` `#7249ca` → **`null`**. That purple came from
  `scripts/granola/update-brand-assets.js` ("dominant purple") and appears nowhere in the
  real logo — the second colour here is the near-black gradient background
  (`#182d26` → `#000000`), a neutral, not a distinct hue. Cleared rather than replaced,
  matching the Affordplan call; `page.tsx:132` falls back to Linkrunner's `#4d4bf7`.

### Notes
- **The room's slug is `kredit`, not `kreditpe`.** Two stale scripts assume otherwise:
  `update-brand-assets.js:108` and `fix-logos.js:54` (`SKIP_SLUGS`) both key on `kreditpe`,
  a slug that does not exist. Neither was touched — they are one-off bulk scripts, not
  live code — but anything driven off them will silently skip this room.
- **The artwork was already on disk and unused.** `public/logos/kreditpe.png` is the same
  image (stored as a JPEG despite the `.png` name), referenced only by
  `update-brand-assets.js`. Because that script keys on the wrong slug, the room kept
  serving the 128px favicon. The room now reads from the bucket, not `public/`.
- Uploaded with `--no-trim`: the icon is deliberately square, full-bleed art. Confirmed
  harmless either way — `trim({threshold:10})` leaves it 512x512 because the gradient
  background is not uniform enough to strip.
- Slug left as `kredit` — renaming changes the room URL and breaks any link already sent.
  So the slug (`kredit`), the storage path (`logos/kredit.png`) and the display name
  (`Kredit.Pe`) now differ by design; only the display name is prospect-visible.

### Files touched
- `docs/changelog/2026-07-31-kreditpe-logo.md` (this file)
- Supabase data otherwise — one `rooms` row (`ada92857-dd4d-41f0-a57d-690d92eec1a1`);
  plus `assets/logos/kredit.png` in storage.

### Verified
- `npx tsx scripts/granola/set-room-brand.ts --slug kredit …` — before/after row printed,
  logo uploaded (202,103 bytes).
- Stored object fetched back from the bucket: HTTP 200, `image/png`, 512x512, 202,103 bytes,
  and eyeballed — the mark round-trips intact.
- `GET /room/kredit` → 200 (62,194 bytes). Rendered HTML: 1 occurrence of
  `assets/logos/kredit.png`, 1 of `#0d8863`, **0** of the old favicon URL, **0** of `#10c060`,
  **0** of `#7249ca`. Computed palette in the page: `--brand-primary:#0d8863`,
  `--brand-primary-light:#dafbf1`, `--brand-primary-dark:#0a6d4f`.
- After the rename, `GET /room/kredit` → 200 (62,246 bytes): **8** occurrences of
  `Kredit.Pe`, **0** bare `Kredit`; email-gate title renders `Kredit.Pe 🤝 Linkrunner`.
  The hero greeting is not in the server-rendered HTML, so it was checked at the source
  instead (`room-hero.tsx:52-61` over `contact_name = "Rohit Kumar"`), not by a grep that
  would have returned 0 either way.
- No source files changed, so no build/lint delta to report.
