#!/usr/bin/env node

/**
 * Sync Granola meetings into the granola_meeting_cache table.
 *
 * Mirrors POST /api/granola/sync but runs locally against the
 * Granola public API (public-api.granola.ai), which is the base
 * URL that actually exists — the in-app route's api.granola.ai 404s.
 *
 * Usage:
 *   node scripts/granola/sync-cache.js [--days 90]
 *
 * Requires env vars (loaded from .env.local):
 *   GRANOLA_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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

const API_BASE = "https://public-api.granola.ai/v1";
const API_KEY = process.env.GRANOLA_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY || !supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing GRANOLA_API_KEY, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithAuth(url) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 429) {
    console.log("  rate limited, waiting 5s...");
    await sleep(5000);
    return fetchWithAuth(url);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Granola API error ${res.status}: ${body}`);
  }
  return res;
}

async function listNotes(sinceIso) {
  const all = [];
  let cursor = null;
  while (true) {
    const params = new URLSearchParams({ limit: "50", created_after: sinceIso });
    if (cursor) params.set("cursor", cursor);
    const res = await fetchWithAuth(`${API_BASE}/notes?${params}`);
    const data = await res.json();
    const notes = data.notes ?? data.data ?? [];
    if (notes.length === 0) break;
    all.push(...notes);
    cursor = data.next_cursor ?? data.cursor ?? null;
    if (!cursor) break;
    await sleep(300);
  }
  return all;
}

async function fetchTranscript(noteId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/notes/${noteId}?include=transcript`);
    const data = await res.json();
    return data.transcript ?? null;
  } catch {
    return null;
  }
}

// Same extraction logic as src/app/api/granola/sync/route.ts
function extractCompanyName(title, participants) {
  const match = title.match(/<>\s*(.+?)\s*\|\|/);
  if (match) return match[1].trim();
  const prospect = participants.find(
    (p) =>
      p.email &&
      !p.is_creator &&
      !p.email.endsWith("@linkrunner.io") &&
      !p.email.endsWith("@gmail.com")
  );
  if (prospect && prospect.email) {
    const domain = prospect.email.split("@")[1]?.split(".")[0];
    if (domain) return domain.charAt(0).toUpperCase() + domain.slice(1);
  }
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
  let days = 90;
  const daysIdx = args.indexOf("--days");
  if (daysIdx !== -1 && args[daysIdx + 1]) days = parseInt(args[daysIdx + 1], 10);

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  console.log(`Listing Granola meetings since ${since}...`);

  const notes = await listNotes(since);
  console.log(`Found ${notes.length} meetings.`);
  if (notes.length === 0) return;

  const rows = [];
  let transcriptsFetched = 0;
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    process.stdout.write(`\rFetching transcript ${i + 1}/${notes.length}...`);
    let transcript = note.transcript;
    if (!transcript) transcript = await fetchTranscript(note.id);
    if (transcript) transcriptsFetched++;

    const participants = (note.people ?? note.participants ?? []).map((p) => ({
      name: p.name ?? "Unknown",
      email: p.email ?? "",
      company: p.company,
      is_creator: p.is_creator,
    }));

    rows.push({
      granola_meeting_id: note.id,
      title: note.title,
      meeting_date: note.start_time ?? note.created_at,
      participants,
      summary: transcript || note.summary || "",
      company_name: extractCompanyName(note.title, participants),
      contact_email: extractContactEmail(participants),
      synced_at: new Date().toISOString(),
    });
    await sleep(200);
  }
  console.log("");

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from("granola_meeting_cache")
    .upsert(rows, { onConflict: "granola_meeting_id" })
    .select("granola_meeting_id");

  if (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  }

  console.log(`Done. Upserted ${data.length} meetings (${transcriptsFetched} with transcripts).`);
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
