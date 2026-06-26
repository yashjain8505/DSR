# Pre-fill default tiers + competitors in the room pricing editor

When a room had no saved structured pricing, the admin pricing editor's
structured mode opened with empty range tiers and no competitors, so an admin
had to build both from scratch. Now they're pre-filled with the standard
defaults, ready to tweak per customer (price, install buckets, per-install
price, free installs via the quote's `free_threshold`, and competitors all
remain editable).

- `src/lib/pricing-defaults.ts` (new): shared `DEFAULT_RANGE_TIERS` and
  `DEFAULT_COMPETITOR_PRICING` (single source of truth). Kept in its own module
  to avoid a constants<->types import cycle.
- `src/components/room/tab-pricing.tsx`: the prospect tab now imports these
  shared defaults instead of defining its own copies.
- `src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx`: on load, when a room
  has no saved range tiers (or legacy volume tiers) it pre-fills
  `DEFAULT_RANGE_TIERS`; when it has no saved competitors it pre-fills
  `DEFAULT_COMPETITOR_PRICING`. The quote already defaulted free installs to
  25,000.
