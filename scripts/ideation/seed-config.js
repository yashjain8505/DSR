#!/usr/bin/env node

/**
 * Seed the ideation engine base layer (engine_config table) from the config/
 * files. Idempotent: only inserts a key that isn't already in the DB — the
 * dashboard is the source of truth after the first seed.
 *
 * Usage:
 *   node scripts/ideation/seed-config.js
 *
 * Requires env vars (loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Requires migration 010_ideation_engine_config.sql to be applied first.
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

const configDir = path.join(__dirname, "../../config");
const SOURCES = {
  company_context: "company-context.md",
  data_assets: "data-assets.json",
  knowledge_base: "sales-followup-knowledge-base.md",
};

async function main() {
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing, error: exErr } = await supabase
    .from("engine_config")
    .select("key");
  if (exErr) {
    console.error(
      `Failed to read engine_config (did you apply 010_ideation_engine_config.sql?): ${exErr.message}`,
    );
    process.exit(1);
  }
  const have = new Set((existing ?? []).map((r) => r.key));

  const rows = [];
  for (const [key, file] of Object.entries(SOURCES)) {
    if (have.has(key)) continue;
    const filePath = path.join(configDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${key}: ${file} not found`);
      continue;
    }
    rows.push({ key, value: fs.readFileSync(filePath, "utf-8") });
  }

  if (!rows.length) {
    console.log(`Nothing to seed (${have.size} keys already present).`);
    return;
  }

  const { error } = await supabase.from("engine_config").insert(rows);
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(
    `Seeded ${rows.length} config key(s): ${rows.map((r) => r.key).join(", ")}.`,
  );
}

main();
