-- Room access control: optional per-room email allowlist
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor > New query).

-- Per-room switch: when true, only emails in room_access may enter the room.
alter table rooms add column restrict_access boolean not null default false;

-- Allowlist: which emails may access a restricted room.
create table room_access (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (room_id, email)
);

create index idx_room_access_room on room_access(room_id);

-- Service-role access only — no public policies.
alter table room_access enable row level security;
