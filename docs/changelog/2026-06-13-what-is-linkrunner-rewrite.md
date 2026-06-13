## 2026-06-13 - linkrunner-dsr — "What is Linkrunner" tab rewritten as a positioning page

### Changed
Rewrote the prospect-facing "What is Linkrunner" overview sub-tab from the five product pillars into a positioning page, per Yash's approved mockup:
- Hero claim ("The world's first truly AI-native MMP") plus a one-line subhead.
- "What it gets you": three unified cards (shared brand-accent icon, equal height, identical padding) led by the real 34% to 46% CPI range.
- "Cost per install over time": a line chart with labeled axes (CPI index 100 down to about 58, months M1 to M6) and a "34% to 46% lower" callout.
- "AI that acts": an AI-insight demo card.
- "Backed by": Titan Capital, Kunal Bahl, Sameer Sud, 2AM VC as monogram lockups.
- Scale band: 250+ customers, 10 countries, fully enterprise compliant.
- Accents use each room's `--brand-primary`. No em dashes anywhere.
- Product feature detail (deep links, remarketing, iOS/SKAN, referrals) still lives on the Features, Product Demo, and How It Works tabs.

### Files touched
- `src/components/room/what-is-linkrunner.tsx` (rewritten; component signature unchanged, still no props)
- `docs/changelog/2026-06-13-what-is-linkrunner-rewrite.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on the component.
- Rendered in the live GoDigit room via the dev server: accessibility snapshot confirmed every section plus the chart axes, and no console errors. A pixel screenshot was blocked because the app root redirects to /admin and the preview tool kept following it; the render itself is confirmed.

### Notes — placeholders to resolve before this is prospect-final
- Investor logos are monogram placeholders. Drop in real logo files (local assets; the room CSP blocks external image hosts).
- Verify investor name spellings (Kunal Bahl, Sameer Sud, 2AM VC).
- The "Faster decisions" and "Attribution you trust" cards have no metric yet (TODO comments in the file).
- The "SDK outdated" example tag is a placeholder pending a final label.
- Not yet pushed/deployed: this changes the "What is Linkrunner" tab in every room.
