## 2026-06-14 - linkrunner-dsr — Features: capability list restored under the glances

### Changed
- **Features** (`features-bento.tsx`): added back the "Also in the platform" capability list at the bottom, under the product glances (campaign analytics, SKAN, audience builder, MCP). It had been dropped when Comp 3 was locked; Yash wanted it back to fill the empty lower space.
- The list is a labelled grid of name + one-line sub: Deep links (deferred and unlimited, merging the old separate deep/deferred items), Referrals, Postbacks, Webhooks, Remarketing, Data export, PII hashing, Fraud protection. White panel, subtle border, no shadows, no em dashes, brand label.

### Files touched
- `src/components/room/features-bento.tsx`
- `docs/changelog/2026-06-14-features-capability-list-back.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on the changed file.
- Rendered via a throwaway `/dev-features` route and screenshotted at 1100px: the capability panel sits under the glances and fills the lower area. Route deleted after.

### Notes
- Committed locally, not pushed.
