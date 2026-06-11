## 2026-06-11 - linkrunner-dsr — Add Urban Money and Sid's Farm to customer reference logos

### Changed
- Added "Urban Money" (urbanmoney.co) and "Sid's Farm" (sidsfarm.com) to `DEFAULT_CUSTOMER_REFERENCES`, so every new room seeds them into its logo wall.
- New logo assets: `public/logos/urban-money.png` (484×484, from the site's og:image) and `public/logos/sids-farm.png` (228×228, from the site's favicon source on the Shopify CDN — largest size available). Both trimmed and square-padded with transparent background via sharp, matching existing assets.
- Backfilled the two references (is_visible=true, appended sort_order) into the 3 existing rooms that have reference rows — same treatment CashBook/Jumbo Gaming/abcoffee got on 2026-06-01. The 1 room with zero reference rows was left untouched (its references were evidently removed deliberately).

### Files touched
- `src/lib/constants.ts`
- `public/logos/urban-money.png` (new)
- `public/logos/sids-farm.png` (new)
- `docs/changelog/2026-06-11-urban-money-sids-farm-reference-logos.md` (this file)

### Verified
- `npm run build` passes; `eslint src/lib/constants.ts` clean.
- Visually inspected both processed PNGs (transparent background, centered, untruncated).
- DB insert returned 6 rows across 3 rooms.
