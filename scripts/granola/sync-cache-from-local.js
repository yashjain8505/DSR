#!/usr/bin/env node

/**
 * Offline Granola sync: load locally-saved transcripts into granola_meeting_cache.
 *
 * Both POST /api/granola/sync and scripts/granola/sync-cache.js pull from the
 * Granola public API, which now returns 403 SUBSCRIPTION_INACTIVE (the workspace
 * API subscription lapsed). This script is the offline equivalent: it reads the
 * transcripts already saved under transcripts/_all_transcripts.json and upserts
 * them into the same granola_meeting_cache table, using the identical company /
 * contact extraction as sync-cache.js.
 *
 * Idempotent: upsert on granola_meeting_id. Non-destructive: preserves any
 * hand-curated company_name already on an existing row (never overwrites it
 * with the auto-derived one).
 *
 * Usage:
 *   node scripts/granola/sync-cache-from-local.js [--file <path>]
 *
 * Requires env vars (loaded from .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local (same loader the sibling scripts use).
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

// --- Extraction logic: identical to scripts/granola/sync-cache.js ---
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "yahoo.in", "outlook.com", "hotmail.com",
  "icloud.com", "proton.me", "protonmail.com", "rediffmail.com",
]);

function extractCompanyName(title, participants) {
  // 1. Explicit company on a non-Linkrunner participant.
  const withCompany = participants.find(
    (p) =>
      p.company &&
      p.company.trim() &&
      !p.is_creator &&
      !(p.email || "").toLowerCase().endsWith("@linkrunner.io")
  );
  if (withCompany && withCompany.company) return withCompany.company.trim();
  // 2. Prospect work-email domain (titles usually hold a person's name).
  const prospect = participants.find((p) => {
    if (!p.email || p.is_creator) return false;
    const domain = p.email.split("@")[1]?.toLowerCase();
    return (
      !!domain &&
      !domain.endsWith("linkrunner.io") &&
      !FREE_EMAIL_DOMAINS.has(domain)
    );
  });
  if (prospect && prospect.email) {
    const label = prospect.email.split("@")[1].toLowerCase().split(".")[0];
    if (label) return label.charAt(0).toUpperCase() + label.slice(1);
  }
  // 3. Fall back to the "<> X ||" title token.
  const match = title.match(/<>\s*(.+?)\s*\|\|/);
  if (match) return match[1].trim();
  return null;
}

function extractContactEmail(participants) {
  const prospect = participants.find(
    (p) => p.email && !p.is_creator && !p.email.endsWith("@linkrunner.io")
  );
  return prospect ? prospect.email : null;
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const file =
    fileIdx !== -1 && args[fileIdx + 1]
      ? args[fileIdx + 1]
      : path.join(__dirname, "transcripts", "_all_transcripts.json");

  if (!fs.existsSync(file)) {
    console.error(`Transcript file not found: ${file}`);
    process.exit(1);
  }

  const recs = JSON.parse(fs.readFileSync(file, "utf-8"));
  if (!Array.isArray(recs) || recs.length === 0) {
    console.error("No transcript records found in file.");
    process.exit(1);
  }
  console.log(`Loaded ${recs.length} local transcripts from ${path.basename(file)}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Preserve already-curated company names on existing rows.
  const ids = recs.map((r) => r.id);
  const { data: existingRows, error: exErr } = await supabase
    .from("granola_meeting_cache")
    .select("granola_meeting_id, company_name")
    .in("granola_meeting_id", ids);
  if (exErr) {
    console.error("Reading existing rows failed:", exErr.message);
    process.exit(1);
  }
  const existingCompany = new Map(
    (existingRows ?? []).map((r) => [r.granola_meeting_id, r.company_name])
  );

  const rows = recs.map((r) => {
    const participants = (r.participants ?? []).map((p) => ({
      name: p.name ?? "Unknown",
      email: p.email ?? "",
      company: p.company,
      is_creator: p.is_creator,
    }));
    return {
      granola_meeting_id: r.id,
      title: r.title,
      meeting_date: r.date,
      participants,
      // Local records store the verbatim transcript as `transcript`; the cache's
      // `summary` column holds the primary text (transcript preferred), matching
      // sync-cache.js which writes transcript || summary || "".
      summary: r.transcript || r.summary || "",
      company_name:
        existingCompany.get(r.id) ?? extractCompanyName(r.title, participants),
      contact_email: extractContactEmail(participants),
      synced_at: new Date().toISOString(),
    };
  });

  const { data, error } = await supabase
    .from("granola_meeting_cache")
    .upsert(rows, { onConflict: "granola_meeting_id" })
    .select("granola_meeting_id, company_name, title");

  if (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  }

  const sorted = (data ?? []).slice().sort((a, b) =>
    String(a.company_name ?? "~").localeCompare(String(b.company_name ?? "~"))
  );
  console.log(`\nUpserted ${data?.length ?? 0} meetings into granola_meeting_cache:`);
  for (const row of sorted) {
    console.log(
      `  ${String(row.company_name ?? "(no company)").padEnd(16)} <- ${row.title}`
    );
  }
  const noCompany = (data ?? []).filter((r) => !r.company_name).length;
  if (noCompany) {
    console.log(
      `\n${noCompany} row(s) have no auto-derived company_name — set it in the admin Meetings tab if you want them matched by the ideation engine.`
    );
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
