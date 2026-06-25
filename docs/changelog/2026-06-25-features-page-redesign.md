# Features page redesign (bento + categories, deep-linked to docs)

Rebuilt `src/components/room/features-bento.tsx` (the room's "Features" sub-tab)
from the old mock-data bento into a documentation-style layout inspired by
docs.linkrunner.io:

- Three marquee highlight tiles up top (Deferred deep linking in the room's
  brand colour, iOS SKAdNetwork, MCP for Claude).
- Three labelled category strips: Core Features (12), SDK-less Integration (4),
  API Reference (5), each an icon + title + one-line value grid.
- Every highlight and card deep-links to its exact page on docs.linkrunner.io
  (URLs taken from the docs sitemap, opened in a new tab with rel="noopener").
- A dashed "Explore the full documentation" footer link.
- Icon tiles use `--brand-primary` via color-mix, so the page themes per room.
  No shadows, no em dashes.

Mockup explorations for this redesign live in `mockups/` (untracked, local only).
