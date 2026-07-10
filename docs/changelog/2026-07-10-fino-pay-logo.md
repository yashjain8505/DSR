## 2026-07-10 - linkrunner-dsr — Fino Pay curated logo + meeting brief

### Changed
- Registered Fino Pay's logo in `CURATED_LOGOS` (`fino.bank.in` → self-hosted in the Supabase `assets` bucket), so a Fino Pay room uses it and it survives room regeneration.
- Synced the Ritika / Fino Pay intro call (Jul 10) into `granola_meeting_cache` from the local transcript (the Granola public API is subscription-inactive), and generated a structured customer-POV `meeting_brief` (Your Situation / Pain Points / What We Showed You / Next Steps) so the room recap renders instead of dumping the raw transcript.

### Files touched
- `src/lib/brand-colors.ts` — added `fino.bank.in` to `CURATED_LOGOS`
- `docs/changelog/2026-07-10-fino-pay-logo.md`
- (data, not in repo) `granola_meeting_cache` row `local-finopay-ritika-2026-07-10` — `summary` (transcript) + `meeting_brief` (structured recap); Supabase `assets/logos/fino-pay.png` uploaded

### Verified
- `npm run build` + `npm run lint` clean.
- `meeting_brief` run through the real `parseBrief()` → renders as snapshot + Your Situation (5) / Pain Points (3) / What We Showed You (8) sections + a 5-item Next Steps card.

### Notes
- This commit also carries two previously-uncommitted `CURATED_LOGOS` entries already sitting in the working tree (`oneway.cab`, `z2adigital.com`) — they can't be split from this file's diff without interactive staging. `constants.ts` (Ferryscanner label fix) and other untracked files were left untouched.
