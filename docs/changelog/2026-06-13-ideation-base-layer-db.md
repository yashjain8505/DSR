## 2026-06-13 - linkrunner-dsr — Ideation engine: two-layer context (DB base layer + per-company context)

### Changed
Reworked the ideation engine into a two-layer context model (the "personalized chatbot" pattern): a shared **base layer** the admin edits from the dashboard, plus an editable **per-company context**.

- **Base layer in the DB** (was `config/` files):
  - Migration `010_ideation_engine_config.sql` (apply by hand): `engine_config(key, value, updated_at)` with service-role RLS, for `company_context` / `data_assets` / `knowledge_base`; plus `prospects.context TEXT`. The play library already lives in the `plays` table.
  - `prompts.ts`: matcher/creative/critic now take a `BaseLayer` argument; the file loaders stay as a fallback; added `synthesisOf()`.
  - `pipeline.ts`: `loadBaseLayer()` reads the `engine_config` rows once per run, with per-key fallback to the `config/` files.
  - New admin page `/admin/ideation/engine` (tabs: Company Context, Data Assets [JSON-validated], Knowledge Base, Plays CRUD) + sidebar "Engine" link. APIs: `/api/ideation/config` (GET/PUT — GET falls back to the files so the editor always shows the effective layer) and `/api/ideation/plays` (+ `/[playId]`).
- **Per-company context** (auto-drafted, then editable):
  - `runIdeation` injects `prospect.context` as authoritative input; on the first run it auto-drafts the context from the extracted signals (`formatSignalsAsContext`), and never overwrites an edited one.
  - `/admin/ideation` prospect rows are now expandable with an editable context box + Save + "Regenerate from meetings". API `/api/ideation/prospects/[prospectId]` (PATCH fields + `regenerate_context` action).
- Idea **quality** is now tunable without code: edit the rules in Company Context + the play list from the dashboard.

### Files touched
- `supabase/migrations/010_ideation_engine_config.sql` (new — apply by hand)
- `scripts/ideation/seed-config.js` (new — seed `engine_config` from `config/` files)
- `src/lib/ideation/{prompts,pipeline}.ts`, `src/lib/types/index.ts`
- `src/app/api/ideation/config/route.ts`, `.../plays/route.ts`, `.../plays/[playId]/route.ts`, `.../prospects/[prospectId]/route.ts` (new)
- `src/app/(admin)/admin/ideation/engine/page.tsx` (new), `src/app/(admin)/admin/ideation/page.tsx`, `src/components/admin/sidebar.tsx`
- `docs/changelog/2026-06-13-ideation-base-layer-db.md` (this file)

### Verified
- `npm run build` passes; lint clean on touched TS/TSX (the new `seed-config.js` carries the same `no-require-imports` baseline every `scripts/` file has).
- Runtime end-to-end: pending the by-hand migration — after applying it + seeding, confirm a Data Assets edit and a per-company context edit both shift the ideas via `npx tsx scripts/ideation/verify-run.ts`.

### Notes — rollout (migration is by hand)
1. Apply `010_ideation_engine_config.sql` in the Supabase SQL editor.
2. `node scripts/ideation/seed-config.js` (optional — the editor and runtime fall back to the `config/` files until a key is saved).
3. Edit the base layer at `/admin/ideation/engine`; curate per-company context on each prospect row in `/admin/ideation`.
- No new env vars. Safe to deploy before the migration runs — the file fallback keeps the engine working.
