## 2026-06-13 - linkrunner-dsr — "What is Linkrunner" redesigned (editorial split)

### Changed
Replaced the positioning-page version of the "What is Linkrunner" tab (committed earlier today in a458f38) with an editorial split, per Yash's locked mockup (option 1). No icon cards, no chart, no shadows:
- Claim headline ("Linkrunner is the world's first truly AI-native MMP") with the accent on "AI-native MMP", plus a one-line subhead.
- "Why we exist" section: a "Stubborn belief and trust" headline, the belief narrative in a left column, and a solid brand-color "Our mission" card on the right (60/40 split, stacks on mobile).
- Footer line: "Backed by Titan Capital, Sameer Sud, and 2AM VC" and "More than 250 customers across 10 countries."
- Accent text, the square bullet, and the mission card all use each room's `--brand-primary`. No em dashes.

### Files touched
- `src/components/room/what-is-linkrunner.tsx` (rewritten; no props)
- `docs/changelog/2026-06-13-what-is-linkrunner-editorial.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on the component.

### Notes
- Confirm investor name spelling (Sameer Sud vs Sood) and whether to add Kunal Bahl to the backing line.
- Committed locally, not pushed. Does not deploy until pushed.
