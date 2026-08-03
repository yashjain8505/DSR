## 2026-08-03 - linkrunner-dsr — Augmont: real logo (was a broken Google share link) + gold/teal palette

### Changed
- `/room/augmont` `logo_url`: **`https://share.google/IqL5mpoJ9oA2ly2hu`** → the Augmont ring
  mark, mirrored into the `assets` bucket (`logos/augmont.png`, 426x426, transparent).
  The old value was **not an image at all** — it is a Google *share* link that redirects to
  `google.com/share.google?q=…` and returns `text/html`. The room was rendering a broken
  image for every visitor. Verified with `curl -sIL` before replacing.
- `brand_primary_color` `#103040` → **`#023642`** (the dark teal behind the supplied app
  icon — 192,735 px, the icon's true ground colour). The old value was close but never
  sampled from the mark.
- `brand_secondary_color` `null` → **`#d6b66e`** (the gold ring; the same hex fell out of
  *both* assets independently — 47,055 px in the site logo, 32,352 in the supplied icon).

### The wordmark was cropped off, deliberately
The supplied asset was the dark app icon; augmont.com also ships the full lockup at
`/assets/logos/logo.png` (601x601, genuinely transparent — 278k transparent px, corners
`a=0`). Three candidates were composited at **true render size** (64 px inside the room's
80 px white tile) and compared:
1. **Supplied dark icon** — a teal square filling the tile. Not wrong (Kredit.Pe looks like
   this), but it is a coloured box next to Linkrunner's, not a mark.
2. **Full site lockup** — transparent and correct, but the ring shrinks to make room for a
   wordmark that is illegible at 64 px.
3. **Ring only, cropped from the lockup** ← shipped. Transparent, and the mark fills the
   tile at ~1.6x the lockup's ring size.
The wordmark is redundant here: the header and hero already print "Augmont" as text
immediately beside the logo, so the lockup was spending pixels repeating it.
The crop line was **derived, not guessed** — scanned every row for fully-transparent bands,
found gaps at y `0–18` and `444–478`, and cut at 444.

### Notes
- `--no-trim` on upload because the ring was already trimmed during the crop step.
- Colour roles are contrast-driven, not preference: `--brand-primary` is a button background
  with white text on it. Gold `#d6b66e` against white is ~1.96:1 (fails WCAG badly); teal
  `#023642` is ~12.9:1. So teal leads and gold is the accent, even though gold is the more
  distinctive Augmont colour.
- `contact_name` was already `Anika Chirawawala` and `company_name` already `Augmont` —
  both correct, neither touched. Hero greeting: *"Dear Anika & Augmont team,"*.
- Room is `restrict_access: true`, so it is allowlist-gated as before.

### Files touched
- `docs/changelog/2026-08-03-augmont-logo.md` (this file)
- Supabase data otherwise — one `rooms` row (`76ad5b5b-9e48-4b02-a1d6-bfca64c0cc00`);
  plus `assets/logos/augmont.png` in storage.

### Verified
- Stored object fetched back from the bucket: HTTP 200, `image/png`, **426x426**,
  12,562 bytes, and eyeballed — transparent ring, round-trips intact.
- **`GET https://dsr.linkrunner.io/room/augmont` → 200** (checked against production, not
  localhost): 1 occurrence of `assets/logos/augmont.png`, **0** of `share.google`, **0** of
  the old `#103040`. Computed palette: `--brand-primary:#023642`,
  `--brand-primary-light:#d7f7fe`, `--brand-primary-dark:#022b35`,
  `--brand-secondary:#d6b66e`.
- No source files changed, so no build/lint delta to report.
