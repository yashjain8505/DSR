## 2026-07-28 - linkrunner-dsr — Pricing tab redesigned + un-hidden on all rooms

### Reversed yesterday's hide
- Un-hid Pricing on all 39 rooms (removed `"pricing"` from `hidden_sections`), and reset `DEFAULT_HIDDEN_SECTIONS` to `[]` so new rooms show it again. (The default-hidden change from `2026-07-28-hide-pricing-by-default.md` is now undone per the new direction.)

### Redesigned `tab-pricing.tsx`
Replaced the interactive per-room estimator (slider + tier ranges + competitor comparison) with a simple, consistent message:
1. **First 25,000 installs free** — the headline offer (brand-primary card).
2. **Default pricing** — "check our standard pricing on the website, but we're happy to customize the quotation based on your volume", with a link to `linkrunner.io/pricing` (verified 200).
3. **CTA — "Book a demo call for a custom quote"** → the demo booking link.
- The CTA uses **`DEMO_CALL_URL`**, the room's default call link — the same Cal.com booking (`cal.linkrunner.io/team/demos/quick-demo`) the floating "Talk to us" button already uses. Extracted that link from `talk-to-us.tsx` into a shared `constants.ts` constant so both use one source; added `PRICING_PAGE_URL` alongside.
- Admin markdown notes (`pricing.content`) still render underneath if set.

### Files touched
- `src/components/room/tab-pricing.tsx` (rewritten)
- `src/lib/constants.ts` (`DEMO_CALL_URL`, `PRICING_PAGE_URL`, `DEFAULT_HIDDEN_SECTIONS` → `[]`)
- `src/components/room/talk-to-us.tsx` (uses the shared `DEMO_CALL_URL`)
- `docs/changelog/2026-07-28-pricing-redesign.md` (this file)
- Supabase data otherwise — `hidden_sections` on all rooms.

### Verified
- `npx tsc --noEmit` clean; `npm run build` compiles; `npm run lint` 0 errors / 58 warnings (unchanged baseline).
- All 39 rooms un-hidden (data-level); `TabPricing` call site passes `companyName` (`room-tabs.tsx:141`).
- Visual not screenshotted (tab is client-rendered behind the room's email gate) — worth an eyeball on a live room after deploy.

### Notes
- The estimator's structured pricing config (`pricing_data`: range tiers, competitor pricing) is **no longer rendered** to prospects — only the fixed message + optional markdown notes show. The admin pricing editor still writes that data, but it's now inert on the prospect side. Cleaning up the editor is a possible follow-up if the structured pricing isn't coming back.
- The headline card uses `bg-[var(--brand-primary)]` with white text (matching the codebase's existing pricing/competitor cards); rooms with a very light brand primary will have soft contrast there — the fix is the room's brand colour, not this component.
