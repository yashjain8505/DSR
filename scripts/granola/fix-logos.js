#!/usr/bin/env node

/**
 * Replace blurry 128px Google Favicon logos with high-res Clearbit logos.
 *
 * For each slug:
 *   1. Try Clearbit: https://logo.clearbit.com/{domain} (HEAD check)
 *   2. Fallback: high-res Google favicon (256px)
 *   3. Update rooms.logo_url in Supabase
 *
 * Usage: node scripts/granola/fix-logos.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    if (!process.env[t.slice(0, eq)]) process.env[t.slice(0, eq)] = t.slice(eq + 1);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Slugs to update: slug -> domain
const SLUG_DOMAIN_MAP = {
  ariai: "ariai.com",
  cambaytiger: "cambaytiger.com",
  collectedge: "collectedge.com",
  flattrade: "flattrade.in",
  haptik: "haptik.ai",
  khelomore: "khelomore.com",
  kiddopia: "kiddopia.com",
  lovelocal: "lovelocal.in",
  mathongo: "mathongo.com",
  sovrenn: "sovrenn.com",
  wedmegood: "wedmegood.com",
  zypp: "zyppelectric.com",
};

// Do NOT touch these slugs (they have local PNGs)
const SKIP_SLUGS = new Set(["cars24", "cash247", "fatakpay", "fatakpay-2", "kreditpe"]);

/**
 * HEAD-check a URL to see if it returns 200 with an image content-type.
 */
async function isImageUrl(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") ?? "";
    return res.ok && ct.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Get the best logo URL for a domain:
 *   1. Clearbit Logo API
 *   2. High-res Google Favicon (256px)
 */
async function getBestLogoUrl(domain) {
  const clearbitUrl = `https://logo.clearbit.com/${domain}`;
  if (await isImageUrl(clearbitUrl)) {
    return { url: clearbitUrl, source: "clearbit" };
  }

  const googleUrl = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;
  return { url: googleUrl, source: "google-256" };
}

async function main() {
  // Fetch only the rooms we care about
  const slugs = Object.keys(SLUG_DOMAIN_MAP);
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, slug, company_name, logo_url")
    .in("slug", slugs);

  if (error) {
    console.error("Failed to fetch rooms:", error);
    process.exit(1);
  }

  console.log(`Found ${rooms.length} rooms to update.\n`);

  const results = [];

  for (const room of rooms) {
    if (SKIP_SLUGS.has(room.slug)) {
      console.log(`SKIP  ${room.slug} — has local PNG`);
      continue;
    }

    const domain = SLUG_DOMAIN_MAP[room.slug];
    if (!domain) {
      console.log(`SKIP  ${room.slug} — no domain mapping`);
      continue;
    }

    process.stdout.write(`CHECK ${room.slug} (${domain})... `);

    const { url: newLogoUrl, source } = await getBestLogoUrl(domain);

    if (newLogoUrl === room.logo_url) {
      console.log(`already set (${source})`);
      results.push({ slug: room.slug, status: "unchanged", source });
      continue;
    }

    const { error: updateError } = await supabase
      .from("rooms")
      .update({ logo_url: newLogoUrl })
      .eq("id", room.id);

    if (updateError) {
      console.log(`FAIL: ${updateError.message}`);
      results.push({ slug: room.slug, status: "error", error: updateError.message });
    } else {
      console.log(`UPDATED (${source})`);
      console.log(`        old: ${room.logo_url}`);
      console.log(`        new: ${newLogoUrl}`);
      results.push({ slug: room.slug, status: "updated", source, oldUrl: room.logo_url, newUrl: newLogoUrl });
    }
  }

  // Summary
  console.log("\n--- SUMMARY ---");
  const updated = results.filter((r) => r.status === "updated");
  const unchanged = results.filter((r) => r.status === "unchanged");
  const errors = results.filter((r) => r.status === "error");

  console.log(`Updated:   ${updated.length}`);
  console.log(`Unchanged: ${unchanged.length}`);
  console.log(`Errors:    ${errors.length}`);

  if (updated.length > 0) {
    console.log("\nUpdated rooms:");
    for (const r of updated) {
      console.log(`  ${r.slug}: ${r.newUrl} (${r.source})`);
    }
  }

  if (errors.length > 0) {
    console.log("\nFailed rooms:");
    for (const r of errors) {
      console.log(`  ${r.slug}: ${r.error}`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
