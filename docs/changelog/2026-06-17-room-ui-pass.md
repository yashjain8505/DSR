## 2026-06-17 - linkrunner-dsr — Room UI: hero copy, Talk-to-us FAB, sticky nav, scroll

### Changed
- Hero: heading now "Welcome to your Linkrunner Digital Boardroom"; the divider
  between the two logos is a handshake emoji instead of x.
- Talk to us: now a small circular button at the bottom-right (was a pill at
  right-center).
- Room layout: removed the mandatory scroll-snap so content scrolls naturally;
  left tab nav is now sticky on desktop (lg:sticky) while the content scrolls;
  the mobile tab bar is sticky to the top while scrolling.

### Files touched
- `src/components/room/room-hero.tsx`, `src/components/room/talk-to-us.tsx`,
  `src/components/room/room-client-wrapper.tsx`, `src/components/room/room-tabs.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0. (Layout/mobile need a visual pass.)
