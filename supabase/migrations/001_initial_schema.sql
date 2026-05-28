-- Linkrunner Digital Sales Room - Initial Schema
-- Run this in your Supabase SQL editor to set up the database

-- UUID generation: gen_random_uuid() is available by default in Supabase.
-- If your project is older, uncomment the line below:
-- create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Rooms: one per prospect/deal
create table rooms (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  company_name text not null,
  logo_url text,
  contact_name text,
  contact_email text,
  is_active boolean not null default true,
  tab_case_studies_visible boolean not null default false,
  tab_comparison_visible boolean not null default false,
  tab_getting_started_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Meeting Briefs: Tab 1 content, one per room
create table meeting_briefs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Overview Sub-tabs: Tab 2, one row per sub-tab per room
create table overview_sub_tabs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  sub_tab_key text not null,
  title text not null,
  content text not null default '',
  youtube_url text,
  iframe_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (room_id, sub_tab_key)
);

-- Pricing: Tab 3, one per room
create table pricing (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms(id) on delete cascade,
  content text not null default '',
  pricing_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Case Studies: Tab 4, multiple per room
create table case_studies (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  title text not null,
  customer_name text not null,
  customer_logo_url text,
  content text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comparisons: Tab 5, multiple competitors per room
create table comparisons (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  competitor_name text not null,
  competitor_logo_url text,
  content text not null default '',
  comparison_data jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Getting Started: Tab 6, one per room
create table getting_started (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references rooms(id) on delete cascade,
  integration_timeline text not null default '',
  migration_steps text not null default '',
  onboarding_plan text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Visitors: email gate captures
create table visitors (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  company text,
  created_at timestamptz not null default now()
);

-- Room Visits: which visitors accessed which rooms
create table room_visits (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  visitor_id uuid not null references visitors(id) on delete cascade,
  first_visited_at timestamptz not null default now(),
  last_visited_at timestamptz not null default now(),
  unique (room_id, visitor_id)
);

-- Analytics Events: all tracked events
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  visitor_id uuid references visitors(id) on delete set null,
  event_type text not null,
  event_data jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_rooms_slug on rooms(slug);
create index idx_rooms_active on rooms(is_active);
create index idx_overview_sub_tabs_room on overview_sub_tabs(room_id);
create index idx_case_studies_room on case_studies(room_id);
create index idx_comparisons_room on comparisons(room_id);
create index idx_room_visits_room on room_visits(room_id);
create index idx_analytics_room_created on analytics_events(room_id, created_at);
create index idx_analytics_visitor on analytics_events(visitor_id);

-- ============================================================
-- AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger rooms_updated_at
  before update on rooms
  for each row execute function update_updated_at_column();

create trigger meeting_briefs_updated_at
  before update on meeting_briefs
  for each row execute function update_updated_at_column();

create trigger overview_sub_tabs_updated_at
  before update on overview_sub_tabs
  for each row execute function update_updated_at_column();

create trigger pricing_updated_at
  before update on pricing
  for each row execute function update_updated_at_column();

create trigger case_studies_updated_at
  before update on case_studies
  for each row execute function update_updated_at_column();

create trigger comparisons_updated_at
  before update on comparisons
  for each row execute function update_updated_at_column();

create trigger getting_started_updated_at
  before update on getting_started
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table rooms enable row level security;
alter table meeting_briefs enable row level security;
alter table overview_sub_tabs enable row level security;
alter table pricing enable row level security;
alter table case_studies enable row level security;
alter table comparisons enable row level security;
alter table getting_started enable row level security;
alter table visitors enable row level security;
alter table room_visits enable row level security;
alter table analytics_events enable row level security;

-- Prospect-facing: allow anonymous reads on content tables
create policy "Public read rooms" on rooms
  for select using (is_active = true);

create policy "Public read meeting_briefs" on meeting_briefs
  for select using (true);

create policy "Public read overview_sub_tabs" on overview_sub_tabs
  for select using (true);

create policy "Public read pricing" on pricing
  for select using (true);

create policy "Public read case_studies" on case_studies
  for select using (true);

create policy "Public read comparisons" on comparisons
  for select using (true);

create policy "Public read getting_started" on getting_started
  for select using (true);

-- Visitors and analytics: allow anonymous inserts (from prospect browser)
create policy "Public insert visitors" on visitors
  for insert with check (true);

create policy "Public update visitors" on visitors
  for update using (true);

create policy "Public insert room_visits" on room_visits
  for insert with check (true);

create policy "Public update room_visits" on room_visits
  for update using (true);

create policy "Public insert analytics_events" on analytics_events
  for insert with check (true);

-- Note: Admin operations (INSERT/UPDATE/DELETE on content tables,
-- SELECT on visitors/analytics) use the service_role key which
-- bypasses RLS entirely.
