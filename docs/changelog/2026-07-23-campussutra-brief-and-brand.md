## 2026-07-23 - linkrunner-dsr — Campus Sutra: rebuild broken brief + fix mismatched brand

### Two problems, both fixed
1. **The meeting brief was the raw transcript dumped verbatim** — speaker labels ("Kaushik Tibrewal:", "Shreyans Sancheti:"), office small talk and speech-to-text noise, all as bullets under a "Pain Points" heading (Groq brief generation had fallen back to a transcript dump).
2. **The room carried a different company's brand entirely** — `logo_url` was a Cahoot SVG (`cahoot.in/.../Cahoot_Symbol_Logo_1_Blue_on_White.svg`, cropped to 32px), `brand_primary_color` `#0052ff` and secondary `#108474` were Cahoot's blue/teal, and `company_name` was "Campussutra". A bad auto-extraction had pulled Cahoot's assets.

### Brief (`scripts/granola/update-campussutra-brief.ts`, new)
- Rewrote from the 23 Jul intro call transcript into a structured recap (Situation / Pain Points / What We Showed You / Questions & Answers / Why It Matters). The transcript was heavily garbled and arrived **out of order** — Granola's "Notes"/discovery half came *after* the "Pain Points"/wrap-up half — so it was reassembled by hand. Office small talk and speaker noise dropped.
- Captured: D2C fashion brand, app now ~20-30% of revenue (~60-75 lakh/mo) and becoming primary; no MMP yet; mostly organic installs via a website nudge; scaling Meta app-install ads (~15/install); app built by a third-party app builder. Demo covered attribution models (last-click, click/view-through, re-engagement), ad set/creative depth, Meta catalog integration, iOS deep-linking reliability, conversion postbacks, SKAdNetwork, MCP.
- **Hard per-install pricing kept out** (the 70-80 paisa figure): `parseBrief` strips `/pric/i` sections and pricing has its own tab, so the model (postpaid, organic free, first 25k free) is stated in Q&A without the number.
- Next steps: forward-looking 3-step plan (structured `next-steps.ts` JSON) — Linkrunner sends a top-3 highlights deck + commercials; Campus Sutra sends app details; Campus Sutra reviews internally and reverts. No hard date: they hedged between "by Monday", "a week", and "2-3 months".

### Brand (via `set-room-brand.ts`)
- Logo → the supplied Campus Sutra graffiti wordmark, trimmed 414x235 → 280x185 (mark was 53% of canvas) and mirrored into the `assets` bucket.
- `company_name` "Campussutra" → **"Campus Sutra"**; `contact_name` "Swapnil Sangam, Kaushik" → "Swapnil Sangam, Kaushik Tibrewal" (greeting: *"Dear Swapnil, Kaushik & Campus Sutra team,"*).
- Colour: primary → **`#1a1a1a`** (near-black), secondary → `#f3cb37` (the brand yellow). The logo is 99.3% golden yellow `#f3cb37`, but `--brand-primary` is used both as text-on-white and as a background with white text (mission cards, 18 background + 30 text/border consumers) — golden yellow fails contrast in both (~1.4:1), the same trap as the Coutloot neon. Near-black is the logo's other colour, reads cleanly with white text, and suits a streetwear brand; the yellow lives in the logo itself.

### Files touched
- `scripts/granola/update-campussutra-brief.ts` (new)
- `docs/changelog/2026-07-23-campussutra-brief-and-brand.md` (this file)
- Supabase data otherwise — one `meeting_briefs` + one `rooms` row; plus `assets/logos/campussutra.png`.

### Verified
- `GET /room/campussutra` 200. All five brief sections render structured; new content present (`app.campussutra.com`, `SKAdNetwork`, `Playo`); new logo + "Campus Sutra" present.
- All-zero checks on the rendered HTML: `cahoot`/`Cahoot`, old `0052ff`, speaker label `Sancheti`, chatter `give us a week`, and `paisa` (pricing number correctly omitted).
- Trimmed logo downloaded back and eyeballed: the graffiti wordmark, clean transparent crop.
