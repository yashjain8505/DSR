-- Ideation Engine: two-layer context (base layer in DB + per-company context).
-- Apply by hand in the Supabase SQL editor (no CLI/migration runner).
--
-- 1) Per-company editable context layer on each prospect.
-- 2) engine_config: the base layer (company context / data assets / knowledge
--    base) moved out of config/ files so it's editable from the admin dashboard.
--    Seed the rows from the current config/ files with
--    `node scripts/ideation/seed-config.js`. The play library already lives in
--    the `plays` table (migration 009).

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS context TEXT;

CREATE TABLE IF NOT EXISTS engine_config (
  key         TEXT PRIMARY KEY,   -- company_context | data_assets | knowledge_base
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS: admin-only via the service role key (matches the other ideation tables).
ALTER TABLE engine_config ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service_role key can read/write this table.
