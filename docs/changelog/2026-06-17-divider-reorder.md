## 2026-06-17 - linkrunner-dsr — Room: clearer dividers + reorder last 3 pages

### Changed
- Added a clear vertical divider (border-r, gray-300) between the left page index
  and the right content; darkened the section dividers (gray-300, was gray-200/70).
- Page order: Integrations, Security & Compliance, and How It Works are now the
  last three pages (in that order; How It Works last).

### Files touched
- `src/components/room/room-tabs.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.
