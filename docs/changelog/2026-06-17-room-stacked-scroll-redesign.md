## 2026-06-17 - linkrunner-dsr — Room: stacked-scroll redesign + numbered index + grid bg

### Changed
- Hero handshake: replaced the dark emoji with a bright white lucide Handshake icon.
- Room content is now ONE continuous scroll: all sections are stacked vertically
  (no tab-switching, no "Go to next page" button). Removed that button.
- Left rail is a sticky, numbered page index (p.01, p.02 …) with a dot per page,
  styled after the reference: active page gets a brand-colored filled dot with a
  soft ring, brand-colored number, bold label, and a light brand-tint highlight.
  Clicking scrolls to a section; an IntersectionObserver scroll-spy highlights
  the section in view. "Powered by Linkrunner" footer.
- Mobile: sticky horizontal page bar (scroll-to + active underline).
- Scroll: hero still snaps to content on the first scroll (snap-proximity); the
  content then scrolls freely through all sections.
- Added a faint grid-line background to the content area.

### Files touched
- `src/components/room/room-tabs.tsx` (rewrite), `src/components/room/room-client-wrapper.tsx`, `src/components/room/room-hero.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0; rooms render 200. NOT visually verified
  (no browser connected) — needs a visual/mobile pass.
