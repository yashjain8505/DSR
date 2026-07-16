# Z2A Digital DSR room + Ferryscanner rename

### Added
- Created the **Z2A Digital** room (`slug: z2a-digital`, id `36c1af3a-c6d6-4860-96c0-ebc902c850c7`) →
  `/room/z2a-digital`. Contact name "Lavinia" (no email provided). Mirrors
  `POST /api/rooms` child seeding (overview sub-tabs, pricing, getting-started,
  customer references, case studies) via a one-off service-role script.
- Logo: Z2A's site mark (charcoal circle + up-right arrow) hosted on Supabase
  (`assets/logos/z2a-digital.png`); `brand_primary_color` `#00ffff` (auto-extracted
  from z2adigital.com — a neon cyan accent; flag for review).
- Registered `z2adigital.com` in `CURATED_LOGOS` (`src/lib/brand-colors.ts`) so
  future regenerations keep the hosted logo.

### Z2A-specific customizations
- **No Recap section**: `hidden_sections = ["recap_discussed","recap_next_steps"]`
  (no Granola note for them) — this removes the Recap tab entirely.
- **Pricing in USD**: `pricing.pricing_data.quote.currency = "$"`; per-install
  tiers **$0.02 (0–50k) / $0.018 (50k–100k) / $0.015 (100k–500k)**, first 25k free;
  competitors AppsFlyer $0.07 / Adjust $0.06 / Branch $0.05. (Currency symbol is
  driven by `quote.currency`; component default is `₹`.)
- **Customers tab enabled** (`tab_customers_references_visible = true`) so the
  customer wall shows. Case Studies / How We Compare / Getting Started left at the
  default (off, admin-unlockable).

### Global fix — "Ferry Scanners" → "Ferryscanner"
- Corrected the typo in `src/lib/constants.ts` (`DEFAULT_CUSTOMER_REFERENCES`
  name + `CUSTOMER_PLAY_STORE_LINKS` key). The app is genuinely "Ferryscanner"
  (`com.ferryscanner.mobile`, `ferryscanner.png`).
- Backfilled existing data: renamed **25** existing `customer_references` rows
  across all rooms from "Ferry Scanners" → "Ferryscanner" (0 stale rows remain).

### Files touched
- `src/lib/constants.ts` (Ferryscanner rename)
- `src/lib/brand-colors.ts` (`z2adigital.com` curated logo)
- Supabase data: new `rooms` row + children, `assets/logos/z2a-digital.png`,
  customer_references rename (data only)
- `docs/changelog/2026-07-08-z2a-digital-room.md` (this file)

### Verified
- `npx eslint src/lib/constants.ts src/lib/brand-colors.ts`: 0 errors.
- Server-rendered `/room/z2a-digital` returns HTTP 200, title "Z2A Digital 🤝
  Linkrunner", contains "Lavinia" and "Ferryscanner", **zero** "Recap" and zero
  "Ferry Scanners" occurrences. Pricing `pricing_data` confirmed in DB
  (currency `$`, tiers 0.02/0.018/0.015, competitors 0.07/0.06/0.05).
- The room is data-complete in prod Supabase, so it renders on production now;
  the two code edits only affect future room creation + logo curation.

### Notes / open
- `brand_primary_color` updated from the auto-extracted neon cyan `#00ffff` to the
  logo's charcoal `#242929` (sampled from the dark pixels of the logo) per request.
- Case-study content still carries INR customer metrics (real figures); that tab
  is off by default for this room.
