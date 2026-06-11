## 2026-06-11 - linkrunner-dsr — Ideation engine: prospect follow-up plays + wild cards

### Changed
Implemented the follow-up ideation engine (per Yash's spec) inside this app, adapted to the existing stack:

- **Persistence**: new tables `prospects`, `transcripts`, `plays`, `runs`, `touches` in `supabase/migrations/009_ideation_engine.sql` (RLS enabled, service-role only, `prospects.room_id` optionally links to a DSR room). ⚠️ **Must be applied by hand in the Supabase SQL editor** before any ideation endpoint works.
- **Engine** (`src/lib/ideation/`): `prompts.ts` (the four neutral prompts: extraction → matcher → creative pass → critic, loading sender content from `config/`) and `pipeline.ts` (orchestration on the Supabase admin client). Transcript sources are pluggable; defaults are **GranolaSource** (reads `granola_meeting_cache` matched by company name — meetings synced today feed the engine automatically) plus the engine's own `transcripts` table and rep notes. Weekly digest posts to `DIGEST_WEBHOOK_URL` → `SLACK_WEBHOOK_URL` → stdout. LLM calls use `@anthropic-ai/sdk` (new dependency) with `ENGINE_MODEL` → `ANTHROPIC_MODEL` → `claude-opus-4-8`, adaptive thinking.
- **Config as content** (`config/`): `company-context.md` (Linkrunner identity, capabilities incl. digital rooms/gifting/Gazette, and email drafting rules — short, no em dashes, no "just checking in", sign-off Yash), `data-assets.json` (real numbers from current pricing/case studies; benchmarks and gift tiers marked "fill in"), `play-library.json` (the 14 seeded plays, verbatim from the spec). Edit these freely; no code changes needed. `next.config.ts` gained `outputFileTracingIncludes` so `config/` ships in the Vercel bundle.
- **API routes** (all `requireAdmin`-gated):
  - `GET/POST /api/ideation/prospects` — list/create prospects (POST accepts an optional inline transcript dump)
  - `POST /api/ideation/run` `{prospect_id}` — full pipeline run (`maxDuration 300`)
  - `GET /api/ideation/due` — touches due in 7 days; `POST` sends the Slack digest
  - `PATCH /api/ideation/touches/[id]` — record sent/skipped + outcome; wild cards earning a reply/meeting auto-promote into `plays`
- **Seeder**: `node scripts/ideation/seed-plays.js` (idempotent by play name).

### Files touched
- `supabase/migrations/009_ideation_engine.sql` (new — apply by hand)
- `config/{company-context.md,data-assets.json,play-library.json}` (new)
- `src/lib/ideation/{prompts,pipeline}.ts` (new)
- `src/app/api/ideation/{prospects,run,due}/route.ts`, `src/app/api/ideation/touches/[touchId]/route.ts` (new)
- `scripts/ideation/seed-plays.js` (new)
- `next.config.ts`, `package.json`/`package-lock.json` (+`@anthropic-ai/sdk`), `.env.example`

### Verified
- `npm run build` passes (all 4 routes registered); eslint clean on all new files.
- Runtime NOT verified end-to-end: requires migration 009 applied + play seeding first.

### Notes — setup steps for Yash
1. Run `supabase/migrations/009_ideation_engine.sql` in the Supabase SQL editor.
2. `node scripts/ideation/seed-plays.js` to load the 14 plays.
3. Create a prospect via `POST /api/ideation/prospects` (company name matching the Granola cache name, e.g. "GoDigit", picks up meetings automatically), then `POST /api/ideation/run`.
4. Optional: set `ENGINE_MODEL` / `DIGEST_WEBHOOK_URL` in Vercel (falls back to existing `ANTHROPIC_MODEL` / `SLACK_WEBHOOK_URL`). `ANTHROPIC_API_KEY` must be set in Vercel for runs to work in prod.
- No admin UI yet — the engine is API-first per the spec; a `/admin/ideation` page is a natural follow-up.
