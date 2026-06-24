## 2026-06-24 - linkrunner-dsr — Hero always uses default Linkrunner purple

### Changed
- Removed per-room brand-color matching on the landing page (hero). The gradient,
  the accent glow, and the CTA text now use the default Linkrunner purple
  (#4d4bf7 / #6e6cff) regardless of the room's brand color. The rest of the room
  still themes per brand.

### Files touched
- `src/components/room/room-hero.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.
