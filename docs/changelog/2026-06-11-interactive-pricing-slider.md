## 2026-06-11 - linkrunner-dsr — Interactive pricing slider + admin range editor + wider room layout

### Changed
- **Room pricing tab rebuilt as an interactive estimator** (Autosend-style, per Yash's references): a snapped volume slider (5K → tier max, nice stops, clickable labels); dragging updates the big monthly price, the per-install rate (resolved from the configured range tier), the highlighted tier card, and the competitor comparison — all live. Brand color returns on the slider, active tier, rate, and Linkrunner compare card (Yash explicitly lifted the color restriction for this). Copy cut to one-liners for time-poor marketer readers.
- **New `range_tiers` shape in `pricing_data` jsonb** (`{min_volume, max_volume, per_install_price}[]`) — no DB migration needed. `RangeTier` added to types. Legacy `volume_tiers` point-brackets are converted to ranges at render and on admin load, so existing rooms keep working.
- **Admin pricing editor** (`/admin/rooms/[roomId]/pricing`): "Volume Pricing" section replaced with "Pricing Ranges" — From / To / Price rows (To validates > From), live "at <max>: ₹X/mo" preview, smart prefill when adding a range (continues from the last one). Saves `range_tiers`. The Customer Quote section now documents its new role: Estimated Volume = slider start; currency/free-threshold/value-props feed the pricing tab.
- **Wider room layout**: content container `max-w-7xl` → `max-w-[1600px]` (and `lg:px-8` dropped), overview tab content `max-w-4xl` → `max-w-5xl`, per Yash's note that the room felt cramped with big side gaps.

### Files touched
- `src/lib/types/index.ts`
- `src/components/room/tab-pricing.tsx` (rewritten)
- `src/components/room/room-client-wrapper.tsx`, `src/components/room/room-tabs.tsx`
- `src/app/(admin)/admin/rooms/[roomId]/pricing/page.tsx`
- `docs/changelog/2026-06-11-interactive-pricing-slider.md` (this file)

### Verified
- `npm run build` + `tsc --noEmit` pass; lint clean on touched files (one pre-existing baseline error untouched).
- Playwright: dragged the slider on /room/vama from 100K → 750K; price went ₹90,000 @ ₹0.90 → ₹5,25,000 @ ₹0.70, tier highlight moved 1st → 3rd bracket, competitor cards recomputed (82% → 86% cheaper vs AppsFlyer).

### Notes
- Default ranges when a room has no pricing config: 0–100K @ ₹0.90, 100K–500K @ ₹0.80, 500K–1M @ ₹0.70 (from linkrunner.io tiers), defaults also for competitors/value props.
- The quote's `per_install_price` field is no longer shown on the room (rate always comes from ranges); field kept in admin for compat.
