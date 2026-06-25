# Remove the Getting Started tab from all rooms

Removed "Getting Started" from the prospect room navigation entirely, so it no
longer renders in any room (existing or new) regardless of per-room visibility
data. No migration needed.

- `src/components/room/room-tabs.tsx` — dropped `getting_started` from the
  `computeVisibleTabs` order, so the tab never appears in the prospect room.
- `src/app/(admin)/admin/rooms/[roomId]/page.tsx` — removed the Getting Started
  entry from the Page Visibility toggles.
- `src/components/admin/sidebar.tsx` — removed the Getting Started editor link
  from the room admin sidebar (and its now-unused Rocket icon import).

The underlying `getting_started` table, API route, and editor page are left in
place (harmless, unreferenced from the UI) so no data is destroyed and the tab
can be reinstated later if ever needed.
