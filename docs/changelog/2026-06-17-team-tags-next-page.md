## 2026-06-17 - linkrunner-dsr — Hero team contacts + floating "Go to next page"

### Changed
- `src/components/room/room-hero.tsx`: the single seller card is now a
  "Your Linkrunner team" card with three contacts (shows on every room hero):
  - Yash Jain (GTM) - yash@linkrunner.io - phone 9425136999 (tel: link)
  - Shreyans Sancheti (CEO) - Shreyans@linkrunner.io
  - Lakshith Dinesh (Head of Growth) - lakshith@linkrunner.io
- `src/components/room/room-tabs.tsx`: added a floating "Go to next page" button
  (sticky, bottom-center, brand-colored) that advances to the immediate next
  page. Page order is linear over the visible tabs, with Recap counting as two
  pages (what we discussed -> next steps). Hidden on the last page. Scrolls the
  content to the top on advance.

### Files touched
- `src/components/room/room-hero.tsx`, `src/components/room/room-tabs.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0 errors.

### Notes
- Both are shared components, so they apply across all rooms automatically.
