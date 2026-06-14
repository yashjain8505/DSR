## 2026-06-14 - linkrunner-dsr — Features tab rebuilt as a glance at the real product

### Changed
- **Features** (`features-bento.tsx`): replaced the highlight-cards-plus-capability-list version with compact "glances" of the actual product (locked design, "Comp 3"). Layout:
  - **Campaign analytics** hero card: Clicks / Installs / Sign-ups / Revenue / Paying users with a three-series trend chart (clicks, installs, sign-ups).
  - **SKAN dashboard** card: installs + CV null rate, with per-channel privacy-tier bars (Meta, Google, TikTok) and a Tier 3 to Tier 0 legend.
  - **Audience builder** card: the "Cart Abandoners" cohort, a couple of preview users, and Download for Google / Meta Ads.
  - **MCP for Claude** card: the in-chat question prompt, an Active status, and a token chip.
- Dropped the "AI signals" block entirely (read as off) and the duplicate deep links / deferred deep links wording from the previous version.
- White product cards on the room's grey content area, subtle borders, no shadows, no em dashes. Labels and the SKAN privacy-tier shades use each room's `--brand-primary` (tiers are derived with `color-mix` so they theme per room); the campaign chart keeps semantic orange/green/blue.

### Why
- Yash wanted the Features tab to actually show what the product looks like (SKAN, campaign analytics, cohorts, MCP) as small cards that fit on one screen, replicated from real dashboard screenshots, rather than a text capability list.

### Files touched
- `src/components/room/features-bento.tsx`
- `docs/changelog/2026-06-14-features-product-glance.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on the changed file.
- Rendered in isolation via a throwaway `/dev-features` route (grey bg + sample brand colour) and screenshotted at 1100px: all four cards render, the SKAN tiers pick up the brand colour, layout matches the locked mockup. The throwaway route was deleted after.

### Notes
- Numbers/labels mirror the product screenshots and are illustrative sample data (not a specific customer's figures).
- Committed locally, not pushed. Does not deploy until pushed.
