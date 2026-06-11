## 2026-06-11 - linkrunner-dsr — Add 1% Club reference logo; reorder controls for the logo wall

### Changed
- Added "1% Club" (onepercentclub.io) to `DEFAULT_CUSTOMER_REFERENCES` with new asset `public/logos/one-percent-club.png` (400×400 app icon from their favicon — their og:image is a full marketing banner, not croppable to a logo). Backfilled a visible row into the 3 existing rooms with references, like the other logos added today.
- **New admin feature**: the Customer References page (`/admin/rooms/[roomId]/customer-references`) now has up/down arrow buttons on every row to reposition logos. Moves swap rows optimistically and persist each affected row's new index as its `sort_order` via the existing PATCH endpoint (no API changes); on failure the list refetches. Prospect rooms already render by `sort_order`, so the new order shows immediately.

### Files touched
- `src/lib/constants.ts`
- `src/app/(admin)/admin/rooms/[roomId]/customer-references/page.tsx`
- `public/logos/one-percent-club.png` (new)
- `docs/changelog/2026-06-11-one-percent-club-logo-reorder-feature.md` (this file)

### Verified
- `npm run build` passes. Lint: my additions clean; the page's one pre-existing `set-state-in-effect` error (the original `useEffect` fetch) is part of the repo's 40-error baseline, untouched.
- DB backfill inserted 3 rows.

### Notes
- Reordering writes `sort_order = array index` for the two swapped rows, so historical duplicate/gappy sort orders self-heal as rows are moved.
