-- Migration: Add customer_references table and tab visibility toggle
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS customer_references (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  logo_url text NOT NULL DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_references_room_id ON customer_references(room_id);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS tab_customers_references_visible boolean NOT NULL DEFAULT false;

ALTER TABLE customer_references ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (prospect pages need this)
CREATE POLICY customer_references_select_all ON customer_references FOR SELECT USING (true);

-- Allow service role full access (admin operations)
CREATE POLICY customer_references_admin_all ON customer_references FOR ALL USING (true) WITH CHECK (true);
