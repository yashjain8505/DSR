-- Per-page visibility: rooms.hidden_sections holds the keys of pages hidden in
-- that room. Empty array = everything visible. Run this in the Supabase SQL
-- editor (Dashboard > SQL Editor) — there is no migration runner.

alter table rooms
  add column if not exists hidden_sections jsonb not null default '[]'::jsonb;

-- Seed from the existing unlockable-tab booleans so currently-hidden tabs stay
-- hidden once the render switches to hidden_sections. Only seeds rooms that
-- haven't been set yet.
update rooms
set hidden_sections = (
  select coalesce(jsonb_agg(s.key), '[]'::jsonb)
  from (
    select 'customers_references' as key where tab_customers_references_visible = false
    union all select 'comparison' where tab_comparison_visible = false
    union all select 'getting_started' where tab_getting_started_visible = false
  ) s
)
where hidden_sections = '[]'::jsonb;
