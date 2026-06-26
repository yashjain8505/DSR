# Free-installs field shown by default (25k) in the pricing editor

The free-installs value (`quote.free_threshold`) lives in the quote block, which
was hidden behind the "Show quote" toggle (off for fresh rooms), so it wasn't
visible to edit. Now:

- `src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx`: the quote/free-tier
  block shows by default (`showQuote` initial state = true), so the free-installs
  field appears with the 25,000 default, editable per customer (e.g. 35k).
- The quote now persists whenever the block is shown (previously it only saved
  when an estimated volume was set), so a free-installs change sticks on its own.

The prospect pricing tab already defaulted to "first 25,000 free" when no quote
was saved, so the default display is unchanged.
