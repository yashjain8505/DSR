## 2026-07-31 - linkrunner-dsr — Rnfiservices: Relipay logo + blue/green palette

### Changed
- `/room/rnfiservices` `logo_url`: `null` → the Relipay lockup, mirrored into the `assets`
  bucket (`logos/rnfiservices.png`, trimmed 166x59 → **163x56**, transparent). The room had
  **no logo at all** — brand extraction found nothing, so the hero was rendering the `"RN"`
  initials fallback (`room-hero.tsx:132-137`).
- `brand_primary_color` `#39c05b` → **`#0276ae`** (the logo's blue: the diamond mark, the
  "reli" wordmark and the tagline — the dominant hue).
- `brand_secondary_color` `null` → **`#32aa52`** (the green of "pay").
- `company_name` `Rnfiservices` → **`RNFI Services`** (machine-cased off the email domain by
  `extractCompanyName`). Yash picked this over `Relipay`: the entity on the contract, even
  though the header mark reads "relipay". Drives the hero greeting
  (`"Dear Rahul & RNFI Services team,"`), the header and the email-gate title.

### Notes
- **Source the light-background logo variant; do not salvage a dark-background one.** The
  logo supplied was a screenshot crop off a dark site header — a 172x75 lockup with navy
  `#000f29` baked in as 78% of its pixels. Two ways to handle that were tried and both were
  wrong:
  1. *Keep the navy, trim the padding* (→ 125x44). Shipped first. In place it renders as a
     dark bar floating inside the room's white logo tile — reads as a foreign object, not a
     logo. Yash flagged it on sight.
  2. *Unmix the navy to transparency.* Rejected before shipping: background-unmixing a
     172x75 anti-aliased raster left grey fringing on the glyphs and reduced the light-blue
     `#94c4dc` "A BRAND OF RNFI" tagline to a smear on white.
  The actual fix was neither — it was **fetching the light-background variant**, which
  existed all along at `https://www.rnfiservices.com/images/logo.png`: the same lockup,
  genuinely transparent (6,030 fully transparent px, all four corners `a=0`), with the
  tagline in dark blue for exactly this context. Trims to 163x56 at 93% ink.
  **Lesson: when a supplied logo has a background baked in, go find the vendor's other
  variant before doing any image surgery.** Brands ship both; the room's tile is white.
- **Colours came from the modes, not the means** — and survived the logo swap unchanged.
  Mean-sampling the screenshot gave `#086ea0` / `#2c974b`, both muddier than the truth:
  on a dark field, anti-aliased edges drag every average *toward navy*, the washout
  `set-room-brand.ts` warns about for logos on white, inverted. The modal buckets
  (`#0276ae`, `#32aa52`) were then confirmed independently against the clean transparent
  asset (`#0276ae` at 1,096 px, `#32aa52` at 143 px) — identical, so no re-set was needed.
- **The logo is Relipay's, not RNFI's** — it reads "relipay / A BRAND OF RNFI", while the
  room is `rnfiservices` for `rahul.bansode@rnfiservices.com`. Kept as-is, with
  `company_name` set to the contracting entity; see Changed.

### Files touched
- `docs/changelog/2026-07-31-rnfiservices-logo.md` (this file)
- Supabase data otherwise — one `rooms` row (`84c47211-3498-47d4-bfbd-b7992f8d1300`);
  plus `assets/logos/rnfiservices.png` in storage.

### Verified
- Stored object fetched back from the bucket: HTTP 200, `image/png`, **163x56**, 16,261 bytes,
  and eyeballed — transparent lockup, round-trips intact.
- `GET /room/rnfiservices` → 200. Rendered HTML: **1** occurrence of the new
  `rnfiservices.png?v=16261`, **0** of the superseded `?v=5733`, **0** of the old `#39c05b`,
  8 of `RNFI Services` and **0** of `Rnfiservices`. Email-gate title renders
  `RNFI Services 🤝 Linkrunner`. Computed palette: `--brand-primary:#0276ae`,
  `--brand-primary-light:#d7f2ff`, `--brand-primary-dark:#025e8b`,
  `--brand-secondary:#32aa52`.
- The `?v=<bytes>` cache-buster did its job across the re-upsert: same bucket path, 5733 →
  16261, so no browser serves the old dark badge.
- Both candidate renderings were checked by compositing at true size (64 px inside the 80 px
  white tile) and looking at them, not by reasoning about them — that is what caught the
  fringing on the unmixed version, and it should have caught the navy bar too.
- No source files changed, so no build/lint delta to report.
