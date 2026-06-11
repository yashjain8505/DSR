## 2026-06-11 - linkrunner-dsr — Features tab trimmed to AI signals + support; WIL pillar cleanup; 50M events perk on pricing

### Changed
- **Features tab**: removed "Campaign answers in one glance" (metric mocks), the "Integrate and go live today" SDK strip, and the SOC 2 one-liner. The dark card is now tagged **"AI signals"** with a three-line explanation (sudden 10% ROAS drop from an outdated SDK or broken link → immediate ping → no lost revenue). The support card is now tagged **"Support in 2 hours, max"**: shared WhatsApp + Slack group, no long email threads, quick text any time; kept the chat mock.
- **What is Linkrunner**: Deep links copy is now "Unlimited deep links, a complete OneLink alternative, fully deferred deep link compatible" (full-width card, routing visual kept). Removed the User attribution card, the 35+/50M/<10min/99.5% stats strip, and the "How {company} goes live" section. Remarketing, iOS & SKAN, Referral tracking unchanged. Dead `companyName` prop plumbing removed through tab-overview/room-tabs.
- **Pricing**: fifth perk tile added, "50M custom events / Free every month" (perks grid now 5-up on desktop).

### Files touched
- `src/components/room/{features-bento,what-is-linkrunner,tab-pricing,tab-overview,room-tabs}.tsx`
- `docs/changelog/2026-06-11-features-trim-wil-trim-events-perk.md` (this file)

### Verified
- `npm run build` passes, eslint clean on touched files.
- Playwright on /room/godigit: Features shows grid + AI signals + support only; WIL shows hero + 4 pillar cards; pricing shows 5 perk tiles and still fits one screen at 1440×900.
