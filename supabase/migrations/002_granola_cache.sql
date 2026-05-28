-- Granola Meeting Cache
-- Stores meeting metadata and summaries synced from Granola.
-- The DSR admin UI reads from this table when importing meeting briefs.

create table granola_meeting_cache (
  id uuid primary key default gen_random_uuid(),
  granola_meeting_id text unique not null,
  title text not null,
  meeting_date timestamptz not null,
  participants jsonb not null default '[]',
  summary text not null default '',
  company_name text,
  contact_email text,
  synced_at timestamptz not null default now()
);

create index idx_granola_cache_date on granola_meeting_cache(meeting_date desc);
create index idx_granola_cache_company on granola_meeting_cache(company_name);
create index idx_granola_cache_granola_id on granola_meeting_cache(granola_meeting_id);

-- RLS: admin-only via service role key (no public access)
alter table granola_meeting_cache enable row level security;

-- No public policies — only the service_role key can read/write this table.
