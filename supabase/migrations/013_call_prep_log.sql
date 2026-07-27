-- Dedup ledger for the pre-call prep doc (/api/cron/call-prep).
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).
--
-- The prep-doc cron polls the calendar every few minutes and fires ~30 min
-- before a meeting. This table records which calendar events have already been
-- prepped, so a meeting produces exactly one prep doc even though several cron
-- runs see it inside the trigger window.

create table call_prep_log (
  calendar_event_id text primary key,
  sent_at timestamptz not null default now()
);

-- Service-role access only (the cron uses the admin client) — no public policies.
alter table call_prep_log enable row level security;
