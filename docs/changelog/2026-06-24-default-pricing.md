# Default pricing tiers updated

Changed the default per-install pricing shown on the prospect pricing page
(used when a room has no custom `range_tiers`).

New defaults:
- ₹1.00 / install for 0 – 50,000 installs
- ₹0.90 / install for 50,000 – 1,00,000 installs
- ₹0.80 / install for 1,00,000 – 5,00,000 installs

Files:
- `src/components/room/tab-pricing.tsx` — `DEFAULT_RANGES`
- `src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx` — first-tier seed in
  `addRangeTier()` aligned to ₹1 / 50k so a fresh tier matches the new default.
