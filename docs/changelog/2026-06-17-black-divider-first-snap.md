## 2026-06-17 - linkrunner-dsr — Black section dividers + firm first-scroll snap

### Changed
- Section dividers are now near-black (border-gray-900) for clear separation
  between pages; removed the eyebrow's trailing hairline (the black rule is the
  divider).
- First scroll from the hero now firmly settles on the content (the first page)
  via a debounced scroll handler that snaps the hero<->content boundary only;
  the content then scrolls freely. Removed the CSS scroll-snap (which couldn't do
  a firm first snap without breaking free content scroll).

### Files touched
- `src/components/room/room-tabs.tsx`, `src/components/room/room-client-wrapper.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0; room renders 200.
