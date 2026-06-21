## 2026-06-17 - linkrunner-dsr — Remove 4 customer logos; drag-to-reorder admin

### Changed
- Removed FatakPay, KreditPe, CARS24, Cash247 from customer references
  (data across all rooms + DEFAULT_CUSTOMER_REFERENCES in constants.ts).
- Admin customer-references editor: replaced the up/down arrow reordering with
  native drag-and-drop (grip handle, draggable rows, drop highlight); persists
  the new sort_order for all rows.

### Files touched
- `src/lib/constants.ts`, `src/app/(admin)/admin/rooms/[roomId]/customer-references/page.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.
