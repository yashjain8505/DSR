## 2026-06-17 - linkrunner-dsr — Per-page visibility (hidden_sections)

### Changed
- Every page can now be toggled visible/invisible per room, including the Recap
  sub-pages (What we discussed / Next Steps), the product/why sections, and
  pricing.
- [migration] `011_section_visibility.sql`: adds `rooms.hidden_sections jsonb`,
  seeded from the existing unlockable-tab booleans. MUST be run by hand.
- Render (`room-tabs`) now derives visible pages from `hidden_sections` (single
  source); Recap shows only its visible sub-pages.
- Admin room settings: replaced "Tab Visibility" with a unified "Page Visibility"
  list (toggles save immediately via PATCH hidden_sections). Graceful before the
  migration: rooms render all pages and the main save is unaffected.

### Files touched
- `supabase/migrations/011_section_visibility.sql` (new), `src/lib/types/index.ts`,
  `src/components/room/room-tabs.tsx`, `src/app/(admin)/admin/rooms/[roomId]/page.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0; room renders 200.

### Notes
- Page-visibility toggles only persist once migration 011 is applied in the
  Supabase SQL editor.
