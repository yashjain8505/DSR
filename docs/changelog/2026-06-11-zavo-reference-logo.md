## 2026-06-11 - linkrunner-dsr — Add Zavo to customer reference logos

### Changed
- Added "Zavo" (thezavo.com) to `DEFAULT_CUSTOMER_REFERENCES`.
- New asset `public/logos/zavo.png` (660×156 wordmark, transparent background) — rasterized from the site's own `zavo-logo.svg`, trimmed via sharp. Wordmark chosen over their circle mark to match the existing wide-wordmark entries (Cash247, Playo, Pronto).
- Backfilled a visible Zavo reference row (appended sort_order) into the same 3 existing rooms that got Urban Money / Sid's Farm earlier today; the 1 room with deliberately-empty references left untouched.

### Files touched
- `src/lib/constants.ts`
- `public/logos/zavo.png` (new)
- `docs/changelog/2026-06-11-zavo-reference-logo.md` (this file)

### Verified
- `npm run build` passes; `eslint src/lib/constants.ts` clean.
- Visually inspected the rendered PNG.
- DB insert returned 3 rows.
