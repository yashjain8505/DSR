# Track section views on scroll (richer activity timeline)

Previously the stacked-scroll room only logged a `tab_click` when a visitor
clicked a left-nav item. Visitors who simply scrolled recorded nothing beyond
page-open and the email gate, so the analytics drilldown timeline was nearly
empty.

`src/components/room/room-tabs.tsx`: a debounced effect now logs a `tab_click`
whenever the scroll-spy active section changes (by scroll OR nav click), deduped
so the same section isn't logged twice in a row. Nav-click emission was folded
into this single path to avoid double-logging.

Result: the drilldown activity timeline now fills with "Viewed Pricing",
"Viewed Features", etc., and combined with the per-section time tracking shows
exactly where a visitor spent their time. Applies to all visits going forward
(historical visits never captured this data and can't be backfilled).
