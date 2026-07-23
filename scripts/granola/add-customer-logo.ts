#!/usr/bin/env npx tsx
/**
 * Add a customer logo to the shared customer-references roster across every room.
 *
 * Customer references are per-room rows in `customer_references`, seeded from
 * DEFAULT_CUSTOMER_REFERENCES (constants.ts) when a room is created. So a new
 * customer has to be added in two places to appear everywhere:
 *   1. this script backfills a row into all existing rooms, and
 *   2. DEFAULT_CUSTOMER_REFERENCES is edited by hand so future rooms include it.
 *
 * The logo is trimmed of its surrounding whitespace and mirrored into our own
 * `assets` bucket. The row is appended (sort_order = current max + 1) so it
 * never disturbs a room's existing order, and the script is idempotent: rooms
 * that already carry this customer by name are skipped.
 *
 * Run from the linkrunner-dsr root:  npx --yes tsx scripts/granola/add-customer-logo.ts
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import sharp from "sharp";

for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf-8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i === -1) continue;
  if (!process.env[t.slice(0, i)]) process.env[t.slice(0, i)] = t.slice(i + 1);
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// --- the customer being added ---
const NAME = "R for Rabbit";
const SOURCE = "~/.claude/image-cache/9f9bffc8-0280-4aa9-a93b-1f30f38f8557/5.png";
const BUCKET_PATH = "logos/r-for-rabbit.png";

async function main() {
  // 1. Trim + host the logo.
  const src = SOURCE.startsWith("~") ? resolve(homedir(), SOURCE.slice(2)) : resolve(SOURCE);
  const trimmed = await sharp(readFileSync(src)).trim({ threshold: 10 }).png().toBuffer();
  const before = await sharp(readFileSync(src)).metadata();
  const after = await sharp(trimmed).metadata();
  console.log(`logo trimmed ${before.width}x${before.height} -> ${after.width}x${after.height}`);

  const { error: upErr } = await sb.storage
    .from("assets")
    .upload(BUCKET_PATH, trimmed, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`logo upload: ${upErr.message}`);
  const {
    data: { publicUrl },
  } = sb.storage.from("assets").getPublicUrl(BUCKET_PATH);
  console.log(`logo hosted -> ${publicUrl}`);

  // 2. Backfill every room.
  const { data: rooms, error: rErr } = await sb.from("rooms").select("id, slug");
  if (rErr) throw new Error(`rooms: ${rErr.message}`);

  let added = 0;
  let skipped = 0;
  for (const room of rooms ?? []) {
    const { data: existing } = await sb
      .from("customer_references")
      .select("name, sort_order")
      .eq("room_id", room.id);

    // Idempotent: skip a room that already carries this customer.
    if ((existing ?? []).some((r) => r.name === NAME)) {
      skipped++;
      continue;
    }

    const maxSort = (existing ?? []).reduce((m, r) => Math.max(m, r.sort_order ?? 0), -1);
    const { error: insErr } = await sb.from("customer_references").insert({
      room_id: room.id,
      name: NAME,
      logo_url: publicUrl,
      is_visible: true,
      sort_order: maxSort + 1,
    });
    if (insErr) throw new Error(`insert (${room.slug}): ${insErr.message}`);
    added++;
  }

  console.log(`\nDone: added to ${added} room(s), skipped ${skipped} already having "${NAME}".`);
  console.log(`\nNext: add to DEFAULT_CUSTOMER_REFERENCES in src/lib/constants.ts:`);
  console.log(`  { name: "${NAME}", logo_url: "${publicUrl}" },`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
