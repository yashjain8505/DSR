-- Global assets: single source of truth for template content shared across all rooms
-- Categories: videos, security_compliance, pricing, general

create table assets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  asset_type text not null default 'markdown',
  content text not null default '',
  url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_assets_category on assets(category);

create trigger assets_updated_at
  before update on assets
  for each row execute function update_updated_at_column();

alter table assets enable row level security;

create policy "Public read assets" on assets
  for select using (true);
