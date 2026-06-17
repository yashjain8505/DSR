## 2026-06-17 - linkrunner-dsr — Company Deck: preview cards + lightbox

### Changed
- Redesigned the Company Deck section. Instead of two full-height embedded PDFs,
  it now shows small first-page preview cards side by side (2-up on desktop,
  stacked on mobile). Clicking a preview opens a large lightbox to explore the
  full deck; a Download button is on each card and in the lightbox. Escape / click
  outside closes it.
  - New `src/components/room/company-deck.tsx` (preview grid + lightbox).
  - `src/components/room/tab-overview.tsx`: company_deck case renders
    `<CompanyDeck>`; removed the old DeckBlock/PdfEmbed full embeds and their
    now-unused imports.
- [data] Renamed the deck asset "Pitch Deck" -> "Intro Deck".

### Files touched
- `src/components/room/company-deck.tsx` (new), `src/components/room/tab-overview.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.

### Notes
- Previews/lightbox use the same /api/assets/proxy same-origin embed (CSP-safe).
