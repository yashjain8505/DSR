#!/usr/bin/env node

/**
 * Fetch brand assets (logo + primary color) for each DSR room
 * from the company's website, then update Supabase.
 *
 * Usage: node scripts/granola/fix-brand-assets.js
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

// Company slug → website domain mapping
const DOMAIN_MAP = {
  anindya: null, // person name, not a company — skip
  ariai: "ariai.com",
  cars24: "cars24.com",
  cambaytiger: "cambaytiger.com",
  cash247: "cash247.in",
  collectedge: "collectedge.com",
  fatakpay: "fatakpay.com",
  "fatakpay-2": "fatakpay.com",
  flattrade: "flattrade.in",
  haptik: "haptik.ai",
  khelomore: "khelomore.com",
  kiddopia: "kiddopia.com",
  kreditpe: "kredit.pe",
  lovelocal: "lovelocal.in",
  mathongo: "mathongo.com",
  sovrenn: "sovrenn.com",
  wedmegood: "wedmegood.com",
  zypp: "zyppelectric.com",
};

/* ------------------------------------------------------------------ */
/* Brand extraction (simplified from src/lib/brand-colors.ts)          */
/* ------------------------------------------------------------------ */

async function fetchHtml(domain) {
  const url = `https://${domain}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (res.ok) return { html: await res.text(), baseUrl: url };
  } catch {}
  return { html: null, baseUrl: url };
}

function resolveUrl(href, baseUrl) {
  const decoded = href.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/");
  if (decoded.startsWith("http://") || decoded.startsWith("https://")) return decoded;
  if (decoded.startsWith("//")) return `https:${decoded}`;
  if (decoded.startsWith("/")) return `${baseUrl}${decoded}`;
  return `${baseUrl}/${decoded}`;
}

function extractLinkHref(html, relPattern, baseUrl) {
  const p1 = new RegExp(`<link\\s[^>]*?${relPattern}[^>]*?href=["']([^"']+)["']`, "i");
  const m1 = html.match(p1);
  if (m1) return resolveUrl(m1[1], baseUrl);
  const p2 = new RegExp(`<link\\s[^>]*?href=["']([^"']+)["'][^>]*?${relPattern}`, "i");
  const m2 = html.match(p2);
  if (m2) return resolveUrl(m2[1], baseUrl);
  return null;
}

function extractLargestIcon(html, baseUrl, minSize = 0) {
  const iconTags = html.match(/<link\s[^>]*?rel=["'](?:icon|shortcut icon)["'][^>]*?>/gi);
  if (!iconTags) return null;
  let bestHref = null, bestSize = 0;
  for (const tag of iconTags) {
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const type = typeMatch?.[1] ?? "";
    if (href.endsWith(".ico") || (type && !type.includes("png") && !type.includes("svg"))) continue;
    const sizeMatch = tag.match(/sizes=["'](\d+)x\d+["']/i);
    const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 32;
    if (size >= minSize && size > bestSize) {
      bestSize = size;
      bestHref = resolveUrl(href, baseUrl);
    }
  }
  return bestHref;
}

async function tryFetchUrl(url, expectedCT) {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(4000), redirect: "follow" });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes(expectedCT)) return url;
  } catch {}
  return null;
}

async function extractLogo(html, domain, baseUrl) {
  if (html) {
    const touchIcon = extractLinkHref(html, `rel=["']apple-touch-icon["']`, baseUrl);
    if (touchIcon) return touchIcon;
    const pngIcon = extractLargestIcon(html, baseUrl, 64);
    if (pngIcon) return pngIcon;
  }
  const wellKnown = await tryFetchUrl(`${baseUrl}/apple-touch-icon.png`, "image/");
  if (wellKnown) return wellKnown;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

function normalizeHex(hex) {
  const c = hex.trim();
  if (c.length === 4) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  return c.substring(0, 7).toLowerCase();
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function isGrayscale(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b) < 20;
}

function isNearWhiteOrBlack(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  return avg > 230 || avg < 25;
}

function isLowSaturation(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const delta = max - min;
  if (max === 0) return true;
  const lightness = (max + min) / 2;
  const saturation = lightness > 127 ? delta / (510 - max - min) : delta / (max + min);
  return saturation < 0.18;
}

function extractBrandColor(html) {
  if (!html) return null;

  // theme-color
  let m = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i);
  if (!m) m = html.match(/<meta[^>]*content=["'](#[0-9a-fA-F]{3,8})["'][^>]*name=["']theme-color["']/i);
  if (m) { const h = normalizeHex(m[1]); if (!isGrayscale(h) && !isNearWhiteOrBlack(h)) return h; }

  // msapplication-TileColor
  m = html.match(/<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i);
  if (m) { const h = normalizeHex(m[1]); if (!isGrayscale(h) && !isNearWhiteOrBlack(h)) return h; }

  // CSS custom properties
  const brandVarPattern = /--((?:primary|brand|accent|main|theme)[a-zA-Z0-9-]*(?:color)?|(?:color-)?(?:primary|brand|accent|main|theme))\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;
  const vars = [];
  let vm;
  while ((vm = brandVarPattern.exec(html)) !== null) {
    const color = normalizeHex(vm[2]);
    if (!isGrayscale(color) && !isNearWhiteOrBlack(color) && !isLowSaturation(color)) {
      vars.push({ name: vm[1], color });
    }
  }
  if (vars.length > 0) {
    const primary = vars.find((v) => v.name.includes("primary") || v.name.includes("brand"));
    return primary ? primary.color : vars[0].color;
  }

  // Dominant color
  const hexPattern = /#([0-9a-fA-F]{6})\b/g;
  const colorCounts = new Map();
  let hm;
  while ((hm = hexPattern.exec(html)) !== null) {
    const hex = `#${hm[1].toLowerCase()}`;
    if (isGrayscale(hex) || isNearWhiteOrBlack(hex) || isLowSaturation(hex)) continue;
    colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
  }
  if (colorCounts.size > 0) {
    const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  return null;
}

async function getBrandAssets(domain) {
  const { html, baseUrl } = await fetchHtml(domain);
  const [logoUrl, brandColor] = await Promise.all([
    extractLogo(html, domain, baseUrl),
    Promise.resolve(extractBrandColor(html)),
  ]);
  return { logoUrl, brandColor };
}

/* ------------------------------------------------------------------ */

async function main() {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, slug, company_name, logo_url, brand_primary_color")
    .order("company_name");

  if (error) {
    console.error("Failed to fetch rooms:", error);
    return;
  }

  console.log(`Found ${rooms.length} rooms. Fetching brand assets...\n`);

  for (const room of rooms) {
    const domain = DOMAIN_MAP[room.slug];

    if (domain === undefined) {
      // Not in map (test rooms etc.) — skip
      console.log(`⏭️  ${room.company_name} (${room.slug}) — not in domain map, skipping`);
      continue;
    }

    if (domain === null) {
      console.log(`⏭️  ${room.company_name} (${room.slug}) — no website domain, skipping`);
      continue;
    }

    console.log(`🔍 ${room.company_name} (${room.slug}) — fetching from ${domain}...`);

    try {
      const { logoUrl, brandColor } = await getBrandAssets(domain);

      const update = {};
      if (logoUrl) update.logo_url = logoUrl;
      if (brandColor) update.brand_primary_color = brandColor;

      if (Object.keys(update).length === 0) {
        console.log(`   ⚠️  No assets found`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("rooms")
        .update(update)
        .eq("id", room.id);

      if (updateError) {
        console.error(`   ❌ Update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ logo: ${logoUrl ?? "none"}`);
        console.log(`   ✅ color: ${brandColor ?? "none"}`);
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log("\n✨ Done!");
}

main().catch(console.error);
