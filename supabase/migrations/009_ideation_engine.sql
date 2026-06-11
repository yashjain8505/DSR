-- Ideation Engine: neutral follow-up ideation for prospects.
-- Five tables: prospects, transcripts, plays, runs, touches.
-- Apply by hand in the Supabase SQL editor (no CLI/migration runner).

CREATE TABLE IF NOT EXISTS prospects (
  id            BIGSERIAL PRIMARY KEY,
  company       TEXT NOT NULL,
  contact_name  TEXT,
  persona       TEXT,                      -- founder | growth | cto | marketing (free text ok)
  stage         TEXT DEFAULT 'new',        -- new | demo_done | evaluating | nurture | negotiating | closed_won | closed_lost
  deal_size     INTEGER,                   -- one number for scale (monthly installs); drives spend tiers
  current_vendor TEXT,                     -- their MMP today
  contract_end_date DATE,                  -- flips the engine into nurture mode
  room_id       UUID REFERENCES rooms(id) ON DELETE SET NULL,  -- optional link to a DSR room
  last_touch_at TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transcripts (
  id           BIGSERIAL PRIMARY KEY,
  prospect_id  BIGINT REFERENCES prospects(id) ON DELETE CASCADE,
  source       TEXT NOT NULL DEFAULT 'internal',  -- internal | granola | email | manual
  meeting_date DATE,
  title        TEXT,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transcripts_prospect ON transcripts(prospect_id, meeting_date DESC);

-- The play library lives in the DB (seeded from config/play-library.json)
-- so plays can be added/edited without touching prompts or redeploying.
CREATE TABLE IF NOT EXISTS plays (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  triggers    TEXT NOT NULL,      -- plain-language trigger conditions; injected into the matcher prompt
  asset_hint  TEXT,               -- what the draft should look like (email / one-pager / table / physical)
  cost_tier   SMALLINT DEFAULT 0, -- 0 = free/digital, 1 = low cost, 2 = gift-tier spend
  min_deal_size INTEGER DEFAULT 0,
  origin      TEXT DEFAULT 'seed',       -- seed | promoted  (promoted = a wild card that worked)
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Every pipeline run is persisted: extracted signals + full output.
CREATE TABLE IF NOT EXISTS runs (
  id          BIGSERIAL PRIMARY KEY,
  prospect_id BIGINT REFERENCES prospects(id) ON DELETE CASCADE,
  mode        TEXT NOT NULL,      -- next_best_action | nurture
  signals     JSONB NOT NULL,
  output      JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Scheduled touches. Powers the "due this week" view and Slack digest.
CREATE TABLE IF NOT EXISTS touches (
  id          BIGSERIAL PRIMARY KEY,
  prospect_id BIGINT REFERENCES prospects(id) ON DELETE CASCADE,
  run_id      BIGINT REFERENCES runs(id) ON DELETE SET NULL,
  due_date    DATE NOT NULL,
  touch_type  TEXT NOT NULL,      -- email | video | gift | page | call | content | other
  title       TEXT NOT NULL,
  why         TEXT,
  draft       TEXT,
  is_wild_card BOOLEAN DEFAULT false,
  status      TEXT DEFAULT 'pending',   -- pending | sent | skipped
  outcome     TEXT,                      -- reply | no_reply | meeting_booked | null
  updated_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_touches_due ON touches(status, due_date);

-- RLS: admin-only via service role key (matches granola_meeting_cache convention).
ALTER TABLE prospects   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays       ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE touches     ENABLE ROW LEVEL SECURITY;
-- No public policies: only the service_role key can read/write these tables.
