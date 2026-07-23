## 2026-07-23 - linkrunner-dsr — Add R for Rabbit to the customer-references roster (all rooms + default)

### Changed
- Added **R for Rabbit** to the shared customer logos shown in every room's customer section.
- Customer references are per-room rows in `customer_references`, seeded from `DEFAULT_CUSTOMER_REFERENCES` at room creation, so a new customer needs adding in two places:
  1. **All 37 existing rooms** backfilled with an R for Rabbit row (via `scripts/granola/add-customer-logo.ts`, new).
  2. **`DEFAULT_CUSTOMER_REFERENCES`** (`src/lib/constants.ts`) gets the entry so every future room includes it.
- Logo trimmed 200x200 → 164x106 (it arrived with heavy white padding) and mirrored into our `assets` bucket at `logos/r-for-rabbit.png` rather than hotlinked.

### How the backfill behaves
- **Appended, not inserted:** each room's row gets `sort_order = current max + 1`, so R for Rabbit lands at the end of that room's list and no existing order is disturbed.
- **Idempotent:** rooms already carrying an "R for Rabbit" row by name are skipped, so re-runs are safe. This run added to 37, skipped 0.
- `is_visible: true`.

### Files touched
- `scripts/granola/add-customer-logo.ts` (new — reusable: swap the NAME/SOURCE/BUCKET_PATH constants for the next customer)
- `src/lib/constants.ts` (`DEFAULT_CUSTOMER_REFERENCES`)
- `docs/changelog/2026-07-23-r-for-rabbit-customer-logo.md` (this file)
- Supabase data otherwise — 37 `customer_references` rows; plus `assets/logos/r-for-rabbit.png`.

### Verified
- `npm run build` compiles; `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- `GET /room/{campussutra,payme-india,teertham}` each render the `r-for-rabbit.png` logo (spot-checked 3 of 37).
- Trimmed logo eyeballed: the green R-for-Rabbit bunny wordmark, tight transparent crop.

### Note
- R for Rabbit came up organically in the 23 Jul Campus Sutra call as a fellow app-builder brand — it is a real Linkrunner-adjacent name, appropriate as social proof.
