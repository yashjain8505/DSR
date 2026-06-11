## 2026-06-11 - linkrunner-dsr — Smooth pricing slider, perk tiles, competitor fix, What-is-Linkrunner rebuilt

### Changed
- **Pricing slider is now continuous.** The track is piecewise-linear between the labelled stops (24 sub-steps per segment), so prospects can drag to any volume (e.g. 76,000) instead of snapping between fixed stops; labels stay evenly spaced and clickable. Price rounds to the nearest 1,000 installs.
- **Competitor data fix + admin guard-rails.** The GoDigit room's competitor card read "250000" because the name field held the volume and the name sat in notes — fixed in DB (now "AppsFlyer"). Admin competitor rows now have explicit per-field labels (Competitor Name / Per-Install Price / Pricing Model / Note) instead of a detached header row, so fields can't be mixed up again.
- **Pricing perks redesigned.** The "All core features included, Postpaid monthly billing…" check list is now four icon tiles with tighter copy: Everything included · Postpaid · No lock-in · Real support (Slack & WhatsApp). Rooms whose stored value props are the old defaults get the new tiles automatically; genuinely custom admin value props still render (as check tiles).
- **What is Linkrunner page completely rebuilt** (per Yash, inspired by Origin/Linktree/Autosend refs): dark editorial hero with serif headline ("Know what *grows* your app."), brand-glow, three glass cards (Attribution / Deep links / AI analyst); a 4-stat strip (35+ integrations, 50M free events, <10 min SDK, 99.5% fraud blocked); four pastel feature cards including an AI chat mock and channel chips; and a personalized "How {company} goes live" 4-step strip with a one-line migration note. Overview tab content widened `max-w-5xl` → `max-w-6xl`.

### Files touched
- `src/components/room/tab-pricing.tsx`
- `src/components/room/what-is-linkrunner.tsx` (rewritten)
- `src/components/room/room-tabs.tsx`
- `src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx`
- DB data fix: `pricing.pricing_data.competitor_pricing[0].name` for the godigit room
- `docs/changelog/2026-06-11-pricing-v2-wil-rebuild.md` (this file)

### Verified
- `npm run build` passes; eslint clean on all touched files.
- Playwright on /room/godigit: mouse-dragged the slider to a non-stop position (76,000 installs → ₹53,200/mo @ ₹0.70); competitor card reads "AppsFlyer · 46% cheaper with us"; perk tiles render; WIL hero/stats/pastel cards/go-live strip all render, personalized "How GoDigit goes live".
