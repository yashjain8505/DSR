#!/usr/bin/env node
/**
 * READ-ONLY audit: dump every room's meeting brief and flag the ones that still
 * read like internal sales-triage notes instead of a customer-POV recap
 * ("very high volume", READINESS, ALL-CAPS "THEIR SITUATION" headers,
 * third-person framing). Originals are written to a local, gitignored dir for
 * review before any rewrite. This script does NOT modify the database.
 *
 * Usage: node scripts/granola/audit-briefs-pov.js
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.local)
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local (same pattern as the other granola scripts).
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const OUT_DIR = path.join(__dirname, "_brief-fix");

// Markers that indicate an internal, non-customer-POV brief. We err toward
// over-flagging — false positives are harmless here (the writer only touches
// rooms a human explicitly prepares a fix for); false negatives are the risk.
const MARKERS = [
  /\bvery high volume\b/i,
  /\bextremely high volume\b/i,
  /\bat their volume\b/i,
  /\bREADINESS\b/,
  /^THEIR SITUATION/im,
  /^WHAT WE SHOWED THEM/im,
  /^THEIR QUESTIONS/im,
  /^PAIN POINTS DISCUSSED/im,
  /^PRICING DISCUSSED/im,
  /\bshowed them\b/i,
  /\btheir situation\b/i,
  /\bwants? to understand\b/i,
  /\bthey (use|want|asked|need|were|are looking)\b/i,
];

function markers(content) {
  const hits = [];
  for (const re of MARKERS) {
    const m = content.match(re);
    if (m) hits.push(m[0].replace(/\s+/g, " ").trim());
  }
  return [...new Set(hits)];
}

async function main() {
  const { data: rooms, error: rErr } = await supabase
    .from("rooms")
    .select("id, slug, company_name");
  if (rErr) {
    console.error("rooms query failed:", rErr.message);
    process.exit(1);
  }

  const { data: briefs, error: bErr } = await supabase
    .from("meeting_briefs")
    .select("room_id, content, next_steps");
  if (bErr) {
    console.error("meeting_briefs query failed:", bErr.message);
    process.exit(1);
  }

  const briefByRoom = new Map(briefs.map((b) => [b.room_id, b]));
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const needsFix = [];
  let cleanCount = 0;
  let emptyCount = 0;

  const sorted = rooms.sort((a, b) =>
    (a.company_name || "").localeCompare(b.company_name || "")
  );

  for (const room of sorted) {
    const brief = briefByRoom.get(room.id);
    const content = (brief?.content || "").trim();
    if (!content) {
      emptyCount++;
      continue;
    }
    const hits = markers(content);
    if (hits.length === 0) {
      cleanCount++;
      continue;
    }
    needsFix.push({ room, brief, hits });
    const safe = (room.slug || room.id).replace(/[^a-z0-9_-]/gi, "_");
    fs.writeFileSync(
      path.join(OUT_DIR, `${safe}.original.md`),
      `<!-- room_id: ${room.id} -->\n` +
        `<!-- slug: ${room.slug} -->\n` +
        `<!-- company: ${room.company_name} -->\n` +
        `<!-- markers: ${hits.join(" | ")} -->\n\n` +
        `=== CONTENT ===\n${brief.content}\n\n` +
        `=== NEXT_STEPS ===\n${brief.next_steps || ""}\n`
    );
  }

  console.log(`\nTotal rooms:            ${rooms.length}`);
  console.log(`Empty briefs (skipped): ${emptyCount}`);
  console.log(`Clean (customer-POV):   ${cleanCount}`);
  console.log(`NEEDS FIX:              ${needsFix.length}\n`);
  for (const n of needsFix) {
    console.log(`  ⚠️  ${n.room.company_name}  [${n.room.slug}]`);
    console.log(`      id=${n.room.id}`);
    console.log(`      markers: ${n.hits.join(", ")}`);
  }
  console.log(`\nOriginals dumped to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
