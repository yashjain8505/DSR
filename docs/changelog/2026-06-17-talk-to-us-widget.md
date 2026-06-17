## 2026-06-17 - linkrunner-dsr — Floating "Talk to us" widget + phone fix

### Changed
- New `src/components/room/talk-to-us.tsx`: a floating button pinned to the right
  edge of the room (fixed, persists on scroll). Click opens a panel "Have a
  doubt? Talk to us" with a "Book a call" CTA that opens the Cal.com booking page
  (cal.linkrunner.io/team/demos/quick-demo) in a new tab. Rendered in
  `room-client-wrapper.tsx` once the email gate is cleared. Brand-colored.
- `room-hero.tsx`: corrected Yash Jain's phone to 9425136499.

### Files touched
- `src/components/room/talk-to-us.tsx` (new), `src/components/room/room-client-wrapper.tsx`, `src/components/room/room-hero.tsx`

### Verified
- npm run build -> 0; npm run lint -> 0.

### Notes
- Booking opens in a new tab (a link navigation, so no room-CSP/iframe issues).
