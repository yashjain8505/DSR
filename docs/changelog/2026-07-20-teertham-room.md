## 2026-07-20 - linkrunner-dsr — Teertham room created from the 20 Jul intro call

### Changed
- Created `/room/teertham` (`bd2a468e-5620-44d3-885a-dcad81e6d14d`) for Teertham (Raghav Sehgal, `admin@teertham.org`) from the 20 Jul 2026 intro call.
- Added `scripts/granola/create-teertham-room.ts`, adapted from `create-elixir-room.ts`. Three deliberate departures from that template:
  - **The brief is hand-written in the script, not Groq-generated.** This call was recorded on a personal Granola account so it never reached `granola_meeting_cache`, and the raw transcript is badly garbled by speech-to-text — the company domain alone appears as both "tear thumb.org" and "yatum.org" — and opens with several minutes of unrelated internal chatter including partial payment-card digits. Running that through the brief generator would have laundered the noise into a prospect-facing page. Everything before "Hi, this is Ragar" was discarded.
  - **Brand assets pulled live** via `extractBrandAssets("teertham.org")` rather than uploading a curated logo.
  - **`restrict_access: true` with explicit `room_access` rows**, where the template hardcodes `false` and seeds none. Tushar is on `gmail.com`, so the `@teertham.org` domain entry does not cover him — he has his own exact-email row.

### Files touched
- `scripts/granola/create-teertham-room.ts` (new)
- `docs/changelog/2026-07-20-teertham-room.md` (this file)
- Supabase data only otherwise — `rooms`, `meeting_briefs`, `overview_sub_tabs`, `pricing`, `getting_started`, `customer_references`, `case_studies`, `room_access`.

### Verified
- Script is idempotent: the second run took the update branch and audited child rows — `meeting_briefs` 1, `overview_sub_tabs` 7, `pricing` 1, `getting_started` 1, `customer_references` 17, `case_studies` 7, `room_access` 2. No `<- MISSING`.
- `GET /room/teertham` returns 200 (66 KB) against `npm run dev`.
- All five brief sections (Your Situation, Pain Points, What We Showed You, Questions & Answers, Why It Matters) render, so `hasStructure()` passes and the room shows the structured icon view rather than the raw-markdown fallback.
- Leak check against the rendered HTML for the internal chatter — card digits (`813080`, `8 1 3 0 8 0`), `which card`, `50k`, `20 people` — all zero hits.

### Follow-up — brief shortened (same day)
- First pass rendered as walls of prose: 6,064 chars, with several bullets running four to six lines. That defeats the point of a recap, which is scanned rather than read. Rewrote all six sections to 3,225 chars (down 47%), 33 bullets averaging 100 chars — roughly one line each, longest 191.
- Substance is unchanged: every disclosed gap and every question Raghav asked is still there, just stated once instead of explained.
- **No inline markdown in brief bullets.** `tab-meeting-brief.tsx:120` renders section items as `<span>{item}</span>`, not through `MarkdownRenderer`, so `**bold**` would surface as literal asterisks. Q&A entries therefore lead with a plain-text question and let the question mark do the visual work. Only the raw-markdown fallback path (when `hasStructure()` fails) runs items through the markdown renderer.
- Re-verified after the rewrite: `GET /room/teertham` 200 (63 KB), all five sections still render structured, leak check still clean.

### Notes
- **The logo is weak.** `extractBrandAssets` fell back to the site favicon: `https://teertham.org/favicon.ico?favicon.3063ip624pa31.ico`, which is actually a 75x71 PNG. It will look soft wherever the room scales it up. Brand colors (`#50c0d0` primary, `#790c08` secondary) were derived from that same 75px image, so they may not match the real brand. Worth supplying a proper logo and re-running — the update branch will pick it up.
- The brief deliberately keeps the disclosed gaps in (no CTV, ~150 vs 10,000 integrations, multi-touch attribution being last-click today, Apple ad affiliate unconnected). Raghav explicitly asked whether multi-touch was "properly working or still needs ironing out" and named it his core reason for wanting an MMP, so burying it would be the wrong trade.
- Pricing is intentionally absent as a *section* — `parseBrief` strips any section whose title matches `/\bpric/i` since pricing has its own tab. The "why is the cost so different" answer survives as a bullet inside Questions & Answers, which the filter does not touch.
