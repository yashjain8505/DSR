#!/usr/bin/env node
/**
 * Populate meeting_brief column in granola_meeting_cache from meeting-briefs.json.
 *
 * Prerequisites:
 *   1. Run migration 005_meeting_brief.sql first (adds the column).
 *   2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 *      OR pass them as environment variables.
 *
 * Usage:
 *   node scripts/granola/populate-briefs.js
 */

const fs = require("fs");
const path = require("path");

// Load .env.local
try {
  const envPath = path.resolve(__dirname, "../../.env.local");
  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  // .env.local not found — rely on env vars
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function main() {
  // Load briefs keyed by granola_meeting_id
  const briefsPath = path.resolve(__dirname, "meeting-briefs.json");
  const briefs = JSON.parse(fs.readFileSync(briefsPath, "utf8"));

  const entries = Object.entries(briefs);
  console.log(`Loaded ${entries.length} meeting briefs\n`);

  let updated = 0;
  let failed = 0;

  for (const [granolaMeetingId, brief] of entries) {
    process.stdout.write(`  ${granolaMeetingId.slice(0, 8)}... `);

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/granola_meeting_cache?granola_meeting_id=eq.${granolaMeetingId}`,
      {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ meeting_brief: brief }),
      }
    );

    if (res.ok) {
      console.log("OK");
      updated++;
    } else {
      const text = await res.text();
      console.log(`FAIL (${res.status}): ${text}`);
      failed++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${failed} failed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
