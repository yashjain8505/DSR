#!/usr/bin/env npx tsx
/**
 * Set a room's brand assets by hand: logo, colors, display name.
 *
 * extractBrandAssets() misses a lot in practice — it doesn't resolve relative
 * logo paths, and falls back to a favicon (often 75px or absent) when it finds
 * nothing. Rather than write another one-off create-<prospect>-room script each
 * time, this takes the values directly.
 *
 * The logo is mirrored into our own `assets` bucket, never hotlinked from the
 * prospect's site: their URL can rotate or disappear and take the room's header
 * with it.
 *
 * Usage (run from the linkrunner-dsr root):
 *   npx --yes tsx scripts/granola/set-room-brand.ts \
 *     --slug aliceblueindia \
 *     --logo ~/Downloads/aliceblue.png \
 *     --primary '#0857a9' --secondary '#3ab93d' \
 *     --company 'Aliceblue'
 *
 * --logo accepts a local path or an http(s) URL. All flags except --slug are
 * optional; omitted fields are left untouched. --secondary '' clears it.
 * Supplied logos are trimmed of surrounding whitespace by default, since brand
 * files usually ship on a padded canvas and the room scales the canvas, not the
 * mark — pass --no-trim to keep the original framing.
 * Tip: sample colors from the logo itself rather than eyeballing — averaging a
 * logo on white drags colors toward white, so weight to saturated core pixels.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";
import sharp from "sharp";

// Load .env.local from the current working directory (run from repo root).
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

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const SLUG = arg("slug");
const LOGO = arg("logo");
const PRIMARY = arg("primary");
const SECONDARY = arg("secondary");
const COMPANY = arg("company");

if (!SLUG) {
  console.error("Usage: --slug <room-slug> [--logo <path|url>] [--primary #hex] [--secondary #hex] [--company Name]");
  process.exit(1);
}

const HEX = /^#[0-9a-fA-F]{6}$/;
for (const [flag, val] of [["primary", PRIMARY], ["secondary", SECONDARY]] as const) {
  // Empty string is the documented way to clear a color; anything else must be a hex.
  if (val !== undefined && val !== "" && !HEX.test(val)) {
    console.error(`--${flag} must be a #rrggbb hex (got ${JSON.stringify(val)})`);
    process.exit(1);
  }
}

async function loadLogo(src: string): Promise<Buffer> {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`logo fetch: ${res.status} ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const expanded = src.startsWith("~") ? resolve(homedir(), src.slice(2)) : resolve(src);
  return readFileSync(expanded);
}

/**
 * Strip the uniform border most supplied logos carry.
 *
 * Brand files are usually exported on a large padded canvas. The room scales the
 * whole canvas to fit its frame, so the padding is what gets sized — the mark
 * itself ends up a fraction of the space and reads as a tiny logo. Trimming to
 * the ink makes it fill the frame. Pass --no-trim for art that is deliberately
 * padded or square.
 */
async function trimLogo(bytes: Buffer): Promise<Buffer> {
  const before = await sharp(bytes).metadata();
  const out = await sharp(bytes).trim({ threshold: 10 }).png().toBuffer();
  const after = await sharp(out).metadata();
  const pct = (n: number, d: number) => Math.round((n / d) * 100);
  console.log(
    `trimmed ${before.width}x${before.height} -> ${after.width}x${after.height}` +
      ` (mark occupied ${pct(after.width! * after.height!, before.width! * before.height!)}% of the canvas)`
  );
  return out;
}

async function main() {
  const { data: room, error } = await sb
    .from("rooms")
    .select("id, slug, company_name, logo_url, brand_primary_color, brand_secondary_color")
    .eq("slug", SLUG)
    .maybeSingle();
  if (error) throw new Error(`lookup: ${error.message}`);
  if (!room) throw new Error(`no room with slug "${SLUG}"`);

  console.log("before:", JSON.stringify(room, null, 2));

  const patch: Record<string, string | null> = {};

  if (LOGO) {
    const raw = await loadLogo(LOGO);
    const bytes = process.argv.includes("--no-trim") ? raw : await trimLogo(raw);
    const path = `logos/${SLUG}.png`;
    const { error: upErr } = await sb.storage
      .from("assets")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(`logo upload: ${upErr.message}`);
    const {
      data: { publicUrl },
    } = sb.storage.from("assets").getPublicUrl(path);
    // Cache-bust: the bucket serves the same URL after an upsert, so a browser
    // that already cached the old image would keep showing it.
    patch.logo_url = `${publicUrl}?v=${bytes.length}`;
    console.log(`logo uploaded (${bytes.length} bytes) -> ${patch.logo_url}`);
  }

  if (PRIMARY !== undefined) patch.brand_primary_color = PRIMARY || null;
  if (SECONDARY !== undefined) patch.brand_secondary_color = SECONDARY || null;
  if (COMPANY !== undefined) patch.company_name = COMPANY;

  if (Object.keys(patch).length === 0) {
    console.log("nothing to change");
    return;
  }

  const { data: updated, error: upErr } = await sb
    .from("rooms")
    .update(patch)
    .eq("id", room.id)
    .select("slug, company_name, logo_url, brand_primary_color, brand_secondary_color")
    .single();
  if (upErr) throw new Error(`update: ${upErr.message}`);

  console.log("after:", JSON.stringify(updated, null, 2));
  console.log(`\nDone — /room/${updated.slug}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
