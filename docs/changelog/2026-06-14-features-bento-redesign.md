## 2026-06-14 - linkrunner-dsr — Features redesigned as a balanced bento

### Changed
- **Features** (`features-bento.tsx`): rewrote as the "balanced bento" the user locked from fresh mockups. Two compact highlight cards (Support: under 2 hours on WhatsApp vs legacy 2 to 4 days; AI signals: caught before the weekly review) sit side by side over a single capability panel that lists all twelve real product capabilities (Attribution, Deep links, Deferred deep links, SKAN for iOS, Audiences, Postbacks, Webhooks, Cohorts, Remarketing, Data export, PII hashing, Fraud protection) in a four-column grid.
- Dropped every lucide icon and the icon-square tiles, the dark AI card, and the WhatsApp chat mockup from the prior version. No shadows, no badges, no em dashes; brand color via `var(--brand-primary)` on the labels only.

### Why
- The earlier version made the support and AI blocks dominate the whole page and the rolled-back capability grid looked like AI-generated icon cards. The user wanted the two themes as small cards with the actual features shown beneath them.

### Files touched
- `src/components/room/features-bento.tsx`
- `docs/changelog/2026-06-14-features-bento-redesign.md` (this file)

### Verified
- `npm run build` passes; `npm run lint` clean on the changed file.
- Rendered the component in isolation via a throwaway `/dev-features` route in the dev server (since prospect rooms gate content behind a client-side hydration step that does not complete in the headless preview) and screenshotted it at 1100px: layout matches the locked mockup. The throwaway route was deleted after.

### Notes
- Committed locally, not pushed. Does not deploy until pushed.
