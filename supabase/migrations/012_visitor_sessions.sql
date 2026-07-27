-- Visitor sessions: dedup ledger for Slack sign-in + session-summary alerts.
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- A "session" is a burst of a visitor's activity in one room; a new session
-- starts after a gap longer than the inactivity threshold (30 min). The cron
-- /api/cron/sessions reconstructs sessions from analytics_events and uses this
-- table only to remember which sessions it has already alerted / summarized,
-- so each session produces exactly one sign-in alert and one summary.

create table visitor_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  visitor_id uuid not null references visitors(id) on delete cascade,
  -- Stable per-session key: "<visitor_id>:<room_id>:<started_at ISO>".
  -- Events are immutable, so a burst's first-event time never changes and
  -- re-runs map the same burst to the same key (idempotent upserts).
  session_key text not null unique,
  started_at timestamptz not null,
  last_event_at timestamptz not null,
  signin_alerted boolean not null default false,
  summary_sent boolean not null default false,
  created_at timestamptz not null default now()
);

-- The cron's hot path: find open (not-yet-summarized) sessions by recency.
create index idx_visitor_sessions_open
  on visitor_sessions (last_event_at)
  where summary_sent = false;

-- Service-role access only (the cron uses the admin client) — no public policies.
alter table visitor_sessions enable row level security;
