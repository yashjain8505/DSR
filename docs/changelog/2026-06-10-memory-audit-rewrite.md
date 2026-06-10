## 2026-06-10 - linkrunner-dsr — Memory audit: rewrite AGENTS.md, scoped supabase/CLAUDE.md, changelog moved into repo

### Changed
- Rewrote `AGENTS.md` from 20 lines of git/changelog rules into a full agent guide: stack + commands, project map, Supabase three-client pattern, cookie auth, Tailwind v4 conventions, env var list, hard rules (push-to-main = prod deploy, manual migrations).
- Added scoped `supabase/CLAUDE.md` documenting that migrations are applied by hand in the Supabase SQL editor (deliberately duplicated with root).
- Moved the shared agent changelog from `/Users/earan/Downloads/omi.md/Omi/log/` into the repo at `docs/changelog/` (same one-file-per-change convention). Old entries remain in Obsidian for history.
- Added missing env vars to `.env.example`: `GRANOLA_API_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (all used in code but previously undeclared).
- Deleted superseded `scripts/migrations/001-customer-references.sql` (canonical copy lives in `supabase/migrations/`).
- `CLAUDE.md` unchanged — still just `@AGENTS.md`.

### Files touched
- `AGENTS.md` (rewritten)
- `supabase/CLAUDE.md` (new)
- `docs/changelog/_README.md`, `docs/changelog/2026-06-10-memory-audit-rewrite.md` (new)
- `.env.example` (3 vars added)
- `scripts/migrations/001-customer-references.sql` (deleted, dir removed)

### Verified
- Docs-only change; no app code touched. `.env.example` additions are empty placeholders.

### Notes
- Security finding reported separately (not fixed): the `admin_auth` cookie is a plain `"true"` string and no `/api/*` route checks auth at all.
