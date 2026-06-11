#!/usr/bin/env node

/**
 * Seed the ideation engine's play library from config/play-library.json.
 * Idempotent: skips plays whose name already exists.
 *
 * Usage:
 *   node scripts/ideation/seed-plays.js
 *
 * Requires env vars (loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires migration 009_ideation_engine.sql to be applied first.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const val = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) process.env[key] = val;
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const plays = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../config/play-library.json"), "utf-8"),
);

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: exErr } = await supabase
    .from("plays")
    .select("name");
  if (exErr) {
    console.error(
      `Failed to read plays (did you apply 009_ideation_engine.sql?): ${exErr.message}`,
    );
    process.exit(1);
  }
  const existingNames = new Set((existing ?? []).map((p) => p.name));

  const rows = plays
    .filter((p) => !existingNames.has(p.name))
    .map((p) => ({
      name: p.name,
      description: p.description,
      triggers: p.triggers,
      asset_hint: p.asset_hint,
      cost_tier: p.cost_tier,
      min_deal_size: p.min_deal_size,
      origin: "seed",
    }));

  if (!rows.length) {
    console.log(`Nothing to seed (${existingNames.size} plays already present).`);
    return;
  }

  const { data, error } = await supabase.from("plays").insert(rows).select("name");
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${data.length} plays (${existingNames.size} already existed).`);
}

main();
