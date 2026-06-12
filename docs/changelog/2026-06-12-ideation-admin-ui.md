## 2026-06-12 - linkrunner-dsr — Admin UI for the ideation engine

### Changed
- New `/admin/ideation` page (sidebar link "Ideation", lightbulb icon):
  - **Prospects table** (company, contact, stage, vendor, installs/mo, contract end) with a per-prospect **Run** button that fires the full pipeline and reports plays/wild-card counts.
  - **New Prospect form**: company (Granola-matched), contact, persona, stage, deal size, current vendor, contract end date (flips nurture mode), rep notes, and an optional manual transcript dump (saved into the engine's `transcripts` table).
  - **Pending touch queue** (next 365 days): expandable cards showing due date, type, wild-card marker, the "why" signal, and the full draft with a copy button; outcome actions — Mark sent / Sent + got reply / Sent + meeting booked / Skip — wired to the feedback loop (reply/meeting on a wild card promotes it into the play library).
  - **Slack digest** button (POST /api/ideation/due).
- `GET /api/ideation/due` now accepts `?days=` (default 7, capped 730); `dueThisWeek(days)` parameterized accordingly.

### Files touched
- `src/app/(admin)/admin/ideation/page.tsx` (new)
- `src/components/admin/sidebar.tsx` (Ideation link)
- `src/app/api/ideation/due/route.ts`, `src/lib/ideation/pipeline.ts` (days param)
- `docs/changelog/2026-06-12-ideation-admin-ui.md` (this file)

### Verified
- `npm run build` + eslint clean (one explicit eslint-disable for the repo's standard fetch-on-mount pattern).
- Playwright with a minted admin session on localhost: page renders with sidebar + live GoDigit prospect; New Prospect form opens with all fields.
- The Run button is wired but the LLM call remains blocked on `ANTHROPIC_API_KEY` (button will surface the API error cleanly until then).
