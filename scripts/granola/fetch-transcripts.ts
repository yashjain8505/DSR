#!/usr/bin/env npx tsx
/**
 * Granola Transcript Fetcher
 *
 * Fetches all meeting transcripts from Granola's public API
 * and saves them as structured JSON files.
 *
 * Usage:
 *   GRANOLA_API_KEY=grl_... npx tsx scripts/granola/fetch-transcripts.ts
 *
 * Options:
 *   --days <n>    Fetch meetings from the last N days (default: 90)
 *   --output <dir> Output directory (default: scripts/granola/transcripts)
 *   --since <date> Fetch meetings since this ISO date
 *
 * To get an API key:
 *   1. Open Granola app
 *   2. Go to Settings → API Keys
 *   3. Create a new key with "notes:read" scope
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// ── Config ──────────────────────────────────────────────────────────
const API_BASE = "https://public-api.granola.ai/v1";
const API_KEY = process.env.GRANOLA_API_KEY;

interface GranolaMeeting {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  people?: Array<{
    name: string;
    email?: string;
    company?: string;
  }>;
  transcript?: string;
  summary?: string;
  panels?: Array<{
    title: string;
    content: string;
  }>;
}

interface TranscriptRecord {
  id: string;
  title: string;
  date: string;
  participants: Array<{ name: string; email?: string; company?: string }>;
  transcript: string;
  summary?: string;
}

// ── API helpers ─────────────────────────────────────────────────────

async function fetchWithAuth(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
  });
  if (res.status === 429) {
    console.log("  ⏳ Rate limited, waiting 5s...");
    await new Promise((r) => setTimeout(r, 5000));
    return fetchWithAuth(url);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res;
}

async function listAllNotes(sinceDate: string): Promise<GranolaMeeting[]> {
  const allNotes: GranolaMeeting[] = [];
  let cursor: string | null = null;

  console.log(`📋 Listing meetings since ${sinceDate}...`);

  while (true) {
    const params = new URLSearchParams({
      limit: "50",
      created_after: sinceDate,
    });
    if (cursor) params.set("cursor", cursor);

    const res = await fetchWithAuth(`${API_BASE}/notes?${params}`);
    const data = await res.json();

    const notes: GranolaMeeting[] = data.notes ?? data.data ?? [];
    if (notes.length === 0) break;

    allNotes.push(...notes);
    console.log(`  Found ${allNotes.length} meetings so far...`);

    cursor = data.next_cursor ?? data.cursor ?? null;
    if (!cursor) break;

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  return allNotes;
}

async function fetchTranscript(noteId: string): Promise<string | null> {
  try {
    const res = await fetchWithAuth(
      `${API_BASE}/notes/${noteId}?include=transcript`
    );
    const data = await res.json();
    return data.transcript ?? null;
  } catch (err) {
    console.error(`  ⚠️  Failed to fetch transcript for ${noteId}:`, err);
    return null;
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  if (!API_KEY) {
    console.error("❌ Missing GRANOLA_API_KEY environment variable.");
    console.error("");
    console.error("To get an API key:");
    console.error("  1. Open Granola app");
    console.error("  2. Go to Settings → API Keys");
    console.error("  3. Create a new key with 'notes:read' scope");
    console.error("");
    console.error("Then run:");
    console.error(
      "  GRANOLA_API_KEY=grl_... npx tsx scripts/granola/fetch-transcripts.ts"
    );
    process.exit(1);
  }

  // Parse CLI args
  const args = process.argv.slice(2);
  let days = 90;
  let outputDir = join(process.cwd(), "scripts/granola/transcripts");

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--days" && args[i + 1]) {
      days = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--output" && args[i + 1]) {
      outputDir = args[i + 1];
      i++;
    } else if (args[i] === "--since" && args[i + 1]) {
      days = -1; // will use sinceDate directly
      const sinceDate = args[i + 1];
      i++;
      // Store for later use
      (global as any).__sinceOverride = sinceDate;
    }
  }

  const sinceDate =
    (global as any).__sinceOverride ??
    new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Create output directory
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // 1. List all meetings
  const meetings = await listAllNotes(sinceDate);
  console.log(`\n✅ Found ${meetings.length} meetings total.\n`);

  if (meetings.length === 0) {
    console.log("No meetings found in the specified range.");
    return;
  }

  // 2. Fetch transcripts for each
  const records: TranscriptRecord[] = [];
  let fetched = 0;
  let skipped = 0;

  for (const meeting of meetings) {
    fetched++;
    process.stdout.write(
      `\r🔄 Fetching transcript ${fetched}/${meetings.length}: ${meeting.title.slice(0, 50)}...`
    );

    // Check if transcript was included in the list response
    let transcript = meeting.transcript;
    if (!transcript) {
      transcript = (await fetchTranscript(meeting.id)) ?? "";
    }

    if (!transcript) {
      skipped++;
      continue;
    }

    const record: TranscriptRecord = {
      id: meeting.id,
      title: meeting.title,
      date: meeting.created_at,
      participants: meeting.people ?? [],
      transcript,
      summary: meeting.summary,
    };

    records.push(record);

    // Save individual transcript file
    const safeTitle = meeting.title
      .replace(/[^a-zA-Z0-9\-_ ]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 80);
    const dateStr = new Date(meeting.created_at)
      .toISOString()
      .split("T")[0];
    const filename = `${dateStr}_${safeTitle}.json`;

    writeFileSync(
      join(outputDir, filename),
      JSON.stringify(record, null, 2),
      "utf-8"
    );

    // Small delay to avoid hammering the API
    await new Promise((r) => setTimeout(r, 200));
  }

  // 3. Save index file
  const index = records.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    participants: r.participants.map((p) => p.name).join(", "),
    transcript_length: r.transcript.length,
  }));

  writeFileSync(
    join(outputDir, "_index.json"),
    JSON.stringify(index, null, 2),
    "utf-8"
  );

  // 4. Save combined file
  writeFileSync(
    join(outputDir, "_all_transcripts.json"),
    JSON.stringify(records, null, 2),
    "utf-8"
  );

  console.log(`\n\n✅ Done!`);
  console.log(`   📁 ${records.length} transcripts saved to: ${outputDir}`);
  console.log(`   ⏭️  ${skipped} meetings skipped (no transcript)`);
  console.log(`   📄 Index: ${join(outputDir, "_index.json")}`);
  console.log(
    `   📦 Combined: ${join(outputDir, "_all_transcripts.json")}`
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
