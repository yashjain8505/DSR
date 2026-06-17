## 2026-06-17 - linkrunner-dsr — Talk to us -> direct Cal link; fix booking subdomain

### Changed
- `src/components/room/talk-to-us.tsx`: the floating "Talk to us" button is now a
  direct link to the Cal.com booking page (opens in a new tab). Removed the
  intermediate "Have a doubt?" panel.
- `src/components/room/how-it-works.tsx`: fixed the "Book a call" link from
  meet.darshal.linkrunner.io -> meet.darshil.linkrunner.io.

### Verified
- npm run build -> 0; npm run lint -> 0.
