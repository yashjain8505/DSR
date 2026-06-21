## 2026-06-17 - linkrunner-dsr — Clearer section boundaries

### Changed
- Each content section now starts with a bold full-width divider (border-t-2)
  plus a "section eyebrow" (page number + name, e.g. p.02 PRODUCT DEMO) and more
  vertical spacing, so moving between pages is obvious.

### Files touched
- `src/components/room/room-tabs.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.
