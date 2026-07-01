# Exclude @linkrunner.io from per-room page views + tab clicks

The per-room analytics already dropped internal (@linkrunner.io) testers from the
visitor list and unique count, but the top-line Page Views and the Tab Click
Breakdown still counted them — so a room could show lots of clicks that were
actually internal testing while the only real visitor had almost none.

`src/app/api/rooms/[roomId]/analytics/route.ts`: page-view and tab-click queries
now include `visitor_id`, and both `total_views` and the tab-click breakdown skip
events from internal visitors (anonymous null-visitor page views are kept as real
prospect traffic).
