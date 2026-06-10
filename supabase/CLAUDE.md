# supabase/ — database

<!-- The migrations-by-hand rule is deliberately duplicated in the root AGENTS.md:
     scoped CLAUDE.md files lazy-load only when an agent works in this directory,
     and an agent creating a migration file without reading this directory first
     needs the root copy as the safety net. Keep both in sync. -->

- Migrations are numbered SQL files (`001_…` → `006_…`), applied **manually in the
  Supabase SQL editor** (Dashboard → SQL Editor). There is no Supabase CLI,
  `config.toml`, or migration runner — do **not** assume `supabase db push` works.
- To change schema: create the next `00N_<desc>.sql` here, and note in your
  changelog entry that it must be run by hand. Never run DDL against prod from app code.
- After schema changes, update `src/lib/types/index.ts` — types are hand-written,
  not generated.
