## 2026-06-17 - linkrunner-dsr — Granola meetings: show company, not contact name

### Changed
- Meeting cards in the admin panel were showing the contact's first name (e.g.
  "Aditya", "Arpit") instead of the company. Cause: `extractCompanyName` read the
  `Linkrunner <> X || ...` title token first, and those titles hold a person's
  name. Reworked the extraction (in both the route and the script) to:
  1. use an explicit participant `company` if Granola provides one,
  2. else the prospect's **work-email domain** (skipping Linkrunner + free
     mailboxes like gmail),
  3. else fall back to the title token (still catches real-company titles like
     "Cars24").
- Added **curation preservation**: a re-sync no longer overwrites an existing
  (hand-fixed) `company_name` — only new rows / rows with no company get the
  auto-derived value. Prevents future syncs from clobbering curated names.
- Data: corrected the 3 newly-synced rows to proper brands (RupeeRedee, Swipe,
  Scripbox) and restored 14 curated names that an over-eager backfill had
  flattened (FatakPay, KheloMore, R for Rabbit, Zypp Electric, …).

### Files touched
- `src/app/api/granola/sync/route.ts`
- `scripts/granola/sync-cache.js`

### Verified
- All 34 `granola_meeting_cache` rows have a non-null `company_name`; the 3
  flagged meetings now read RupeeRedee / Swipe / Scripbox.
- `npm run build` -> exit 0; `npm run lint` -> 0 errors.

### Notes
- Auto-derived names use the email-domain label (casing approximate, e.g.
  "getswipe" -> "Getswipe"); curated names always win on re-sync.
- Granola API sync still blocked by the inactive workspace subscription (see
  2026-06-17 granola sync note) — these changes apply once it's renewed.
