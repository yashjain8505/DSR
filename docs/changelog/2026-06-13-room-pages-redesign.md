## 2026-06-13 - linkrunner-dsr — Room pages pass: values, Features, Compare, How It Works, flags, pricing

### Changed
A redesign pass across several prospect-room tabs, per Yash. Editorial, no shadows, no em dashes, brand color via each room's `--brand-primary`.

- **What is Linkrunner** (`what-is-linkrunner.tsx`): headline now breaks so "AI-native MMP" sits on its own line. Added a "What we value" section ("Four lines we keep coming back to": Be honest, Care about the craft, Help each other win, Keep learning) as a numbered 2x2 grid.
- **Features** (`features-bento.tsx`): rewritten. Dropped the 12-icon capability grid. Now leads with support (legacy 2 to 4 day support vs Linkrunner's shared WhatsApp group, sorted in under 2 hours) and AI signals (what they catch and why). Editorial, not text-heavy.
- **How We Compare** (`tab-comparisons.tsx`): now a selectable view. Pick a vendor (AppsFlyer / Adjust / Branch) and see Linkrunner vs them as a clean Capability, Linkrunner, competitor table, one vendor at a time. Same comparison copy as before.
- **How It Works** (`how-it-works.tsx`, new; routed from `tab-overview.tsx`): replaced the docs dump with five quick steps, a "book a call with the technical team" box, and a link to docs.linkrunner.io (docs can't be iframed, X-Frame-Options DENY). Removed the old inline DocsCallout.
- **Customer references** (`customers-references.tsx`): country flags are now rectangular flag images (flagcdn), not rounded emoji. Removed the card shadow.
- **Pricing** (`tab-pricing.tsx`): removed the icons on the perk tiles (Everything included, Postpaid, No lock-in, Real support, 50M custom events); text only.

### Files touched
- `src/components/room/{what-is-linkrunner,features-bento,customers-references,tab-comparisons,tab-overview,tab-pricing}.tsx`
- `src/components/room/how-it-works.tsx` (new)
- `docs/changelog/2026-06-13-room-pages-redesign.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on all changed files (only the pre-existing `<img>` warnings).

### Notes
- How It Works "Book a call" link is a placeholder (`https://calendly.com/linkrunner`). Set the real booking URL.
- Flags load from flagcdn.com (allowed by the room CSP `img-src https:`).
- Committed locally, not pushed. Does not deploy until pushed.
