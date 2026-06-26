# Replace Customer Quote block with a simple Free Installs field

The structured pricing editor's "Customer Quote" section (estimated volume,
per-install price, currency, free threshold, value props, Show-quote toggle,
live preview) was more than needed. Replaced it with a single **Free Installs**
field.

`src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx`:
- Removed the entire Customer Quote UI, the `showQuote` toggle/state, the live
  preview, and the now-unused `fmtCost` and `Toggle` import.
- Added a Free Installs input bound to `quote.free_threshold`, defaulting to
  25,000 and editable per customer.
- The quote is now always persisted on save (carrying free_threshold; other
  quote fields keep defaults), so a free-installs change sticks. The prospect
  pricing tab already falls back to "first 25,000 free" and a 100k slider start
  when those fields aren't set, so nothing breaks.
- The per-competitor savings preview was gated on `estimated_volume > 0`, so it
  simply no longer renders in the editor; competitors and the prospect-side
  comparison are unaffected.
