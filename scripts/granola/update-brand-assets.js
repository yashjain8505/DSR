#!/usr/bin/env node

/**
 * Definitive brand-asset updater for all DSR rooms.
 *
 * For every room in the database whose slug appears in BRAND_DATA below,
 * this script sets logo_url and brand_primary_color.
 *
 * Logo priority:
 *   1. Manual override (verified via HEAD request or browser inspection)
 *   2. Apple-touch-icon extracted from the company's website HTML
 *   3. Large favicon (PNG/SVG, ≥64 px) from <link rel="icon">
 *   4. Well-known /apple-touch-icon.png path (HEAD-checked)
 *   5. <img> with "logo" in src/alt inside <header>/<nav>
 *   6. Any <img> with "logo" in src anywhere on the page
 *   7. Google Favicon v2 at 256 px (last resort)
 *
 * Color: always uses the manual override — every color was verified by
 * inspecting theme-color meta tags, CSS custom properties, and computed
 * background-color from the live website.
 *
 * Usage:  node scripts/granola/update-brand-assets.js
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// ── Load .env.local ──────────────────────────────────────────────────
const envPath = path.join(__dirname, "../../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
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
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ── Verified brand data ──────────────────────────────────────────────
// Every color was confirmed against the live website (theme-color meta,
// CSS vars, computed styles).  Logo overrides are URLs that were
// HEAD-checked for 200 + image content-type or visually verified in a
// browser session.
const BRAND_DATA = {
  ariai: {
    domain: "ariai.com",
    color: "#006838", // theme-color meta
    logo: "https://www.ariai.com/images/ari-icon.svg", // SVG icon (touch-icon 404s)
  },
  cambaytiger: {
    domain: "cambaytiger.com",
    color: "#05449c", // dominant blue (198× in CSS)
    logo: "https://imagecdn.farziengineer.co/cambaytiger/hosted/logo-bb6ffaed65a3-bb67402fa62f.png",
  },
  cars24: {
    domain: "cars24.com",
    color: "#4736fe", // computed bg (5×), brand purple-blue
    logo: "/logos/cars24.png", // local 512×512 PNG
  },
  cash247: {
    domain: "cash247.in",
    color: "#b330c2", // dominant purple
    logo: "/logos/cash247.png", // local 660×211 PNG
  },
  collectedge: {
    domain: "collectedge.in", // .com is parked by HugeDomains
    color: "#ee5d36", // burnt orange, React SVG icon fills (8×)
    logo: "https://www.collectedge.in/favicons/apple-touch-icon.png", // 180×180 PNG
  },
  fatakpay: {
    domain: "fatakpay.com",
    color: "#44226e", // deep purple, brand primary
    logo: "/logos/fatakpay.png", // local 512×512 PNG
  },
  "fatakpay-2": {
    domain: "fatakpay.com",
    color: "#44226e",
    logo: "/logos/fatakpay.png", // local 512×512 PNG
  },
  flattrade: {
    domain: "flattrade.in",
    color: "#2563eb", // Tailwind blue-600, 126× in style.css, all CTAs + gradients
    logo: "https://flattrade.in/assets/images/flattrade_logo.webp", // 419×53
  },
  haptik: {
    domain: "haptik.ai",
    color: "#0067dd", // dominant blue (10× in CSS)
    logo: "https://www.haptik.ai/hs-fs/hubfs/haptik-logo-2.webp?width=394&height=180&name=haptik-logo-2.webp", // 15.2 KB
  },
  khelomore: {
    domain: "khelomore.com",
    color: "#ff4e00", // .primary-btn bg, 10× in CSS
    logo: "https://www.khelomore.com/logo512.png", // 512×512 PNG
  },
  kiddopia: {
    domain: "kiddopia.com",
    color: "#367bf6", // .btn.btn-main bg, primary action color
    logo: "https://kiddopia.com/static/favicon/apple-touch-icon.png", // 180×180 PNG
  },
  kreditpe: {
    domain: "kredit.pe",
    color: "#7249ca", // dominant purple
    logo: "/logos/kreditpe.png", // local 88 KB PNG
  },
  lovelocal: {
    domain: "lovelocal.in",
    color: "#b8238d", // theme-color meta + dominant
    logo: "https://love-local.s3.ap-south-1.amazonaws.com/images/LoveLocal_B2C_Icon.png", // S3 OG image, 8.5 KB
  },
  mathongo: {
    domain: "mathongo.com",
    color: "#1589ee", // theme-color meta
    logo: "https://www.mathongo.com/public/brand/mathongo/logo-dark.svg", // SVG
  },
  sovrenn: {
    domain: "sovrenn.com",
    color: "#06a77d", // MUI palette primary.main
    logo: "https://www.sovrenn.com/logo.svg", // 6.4 KB SVG
  },
  wedmegood: {
    domain: "wedmegood.com",
    color: "#e72e77", // theme-color meta + dominant (165×)
    logo: "https://images.wedmegood.com/images/WMG-logo.svg", // SVG
  },
  zypp: {
    domain: "zyppelectric.com",
    color: "#00bc84", // dominant green from zypp.app
    logo: "https://zypp.app/assets/zypp_logo-e1uwW8Eg.png", // 9.7 KB PNG from zypp.app
  },
};

// ── HTTP helpers ─────────────────────────────────────────────────────

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120";

async function fetchHtml(domain) {
  for (const prefix of [`https://${domain}`, `https://www.${domain}`]) {
    try {
      const res = await fetch(prefix, {
        headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
        signal: AbortSignal.timeout(12_000),
        redirect: "follow",
      });
      if (res.ok) return { html: await res.text(), baseUrl: prefix };
    } catch {
      /* try next */
    }
  }
  return { html: null, baseUrl: `https://${domain}` };
}

async function headCheck(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(5_000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") || "";
    return res.ok && ct.includes("image");
  } catch {
    return false;
  }
}

function resolveUrl(href, baseUrl) {
  if (!href) return null;
  const decoded = href.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/");
  if (decoded.startsWith("http://") || decoded.startsWith("https://"))
    return decoded;
  if (decoded.startsWith("//")) return `https:${decoded}`;
  if (decoded.startsWith("/")) return `${baseUrl}${decoded}`;
  return `${baseUrl}/${decoded}`;
}

// ── Logo extraction from HTML ────────────────────────────────────────

function extractAppleTouchIcon(html, baseUrl) {
  for (const pattern of [
    /rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*href=["']([^"']+)["']/i,
    /href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon(?:-precomposed)?["']/i,
  ]) {
    const m = html.match(pattern);
    if (m) return resolveUrl(m[1], baseUrl);
  }
  return null;
}

function extractLargestFavicon(html, baseUrl) {
  const tags = html.match(/<link\s[^>]*?rel=["'](?:icon|shortcut icon)["'][^>]*?>/gi);
  if (!tags) return null;
  let best = null;
  let bestSize = 0;
  for (const tag of tags) {
    const hrefM = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefM) continue;
    const href = hrefM[1];
    if (href.endsWith(".ico")) continue;
    const sizeM = tag.match(/sizes=["'](\d+)x\d+["']/i);
    const size = sizeM ? parseInt(sizeM[1], 10) : 32;
    if (size >= 64 && size > bestSize) {
      bestSize = size;
      best = resolveUrl(href, baseUrl);
    }
  }
  return best;
}

function extractHeaderLogo(html, baseUrl) {
  const headerM = html.match(/<(?:header|nav)\b[^>]*>[\s\S]*?<\/(?:header|nav)>/gi);
  if (!headerM) return null;
  for (const block of headerM) {
    const imgPattern = /<img[^>]*?src=["']([^"']+)["'][^>]*?>/gi;
    let m;
    while ((m = imgPattern.exec(block)) !== null) {
      const src = m[1];
      if (src.startsWith("data:")) continue;
      const tag = m[0].toLowerCase();
      const srcLc = src.toLowerCase();
      if (tag.includes("logo") || srcLc.includes("logo") || tag.includes("brand")) {
        return resolveUrl(src, baseUrl);
      }
    }
  }
  return null;
}

function extractAnyLogoImg(html, baseUrl) {
  const pattern = /<img[^>]*?src=["']([^"']*logo[^"']*?)["'][^>]*?>/gi;
  let m;
  while ((m = pattern.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith("data:")) continue;
    // Skip tracking pixels
    if (src.includes("pixel") || src.includes("1x1")) continue;
    return resolveUrl(src, baseUrl);
  }
  return null;
}

async function findBestLogo(domain, html, baseUrl) {
  const candidates = [];

  if (html) {
    // 1. Apple-touch-icon from HTML
    const ati = extractAppleTouchIcon(html, baseUrl);
    if (ati) candidates.push({ type: "apple-touch-icon", url: ati });

    // 2. Large favicon (≥64 px, not .ico)
    const fav = extractLargestFavicon(html, baseUrl);
    if (fav) candidates.push({ type: "large-favicon", url: fav });

    // 3. Header/nav logo img
    const hdr = extractHeaderLogo(html, baseUrl);
    if (hdr) candidates.push({ type: "header-logo", url: hdr });

    // 4. Any img with "logo" in src
    const any = extractAnyLogoImg(html, baseUrl);
    if (any) candidates.push({ type: "page-logo", url: any });
  }

  // 5. Well-known paths
  for (const p of ["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"]) {
    candidates.push({ type: "well-known", url: `${baseUrl}${p}` });
  }

  // HEAD-check candidates in order until one works
  for (const c of candidates) {
    if (await headCheck(c.url)) {
      return { url: c.url, type: c.type };
    }
  }

  // 6. Last resort: Google Favicon v2 at 256 px
  return {
    url: `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    type: "google-favicon-256",
  };
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const { data: rooms, error } = await supabase
    .from("rooms")
    .select("id, slug, company_name, logo_url, brand_primary_color")
    .order("company_name");

  if (error) {
    console.error("Failed to fetch rooms:", error.message);
    process.exit(1);
  }

  console.log(`Found ${rooms.length} rooms.\n`);

  let updated = 0;
  let skipped = 0;

  for (const room of rooms) {
    const brand = BRAND_DATA[room.slug];

    if (!brand) {
      console.log(`⏭️  ${room.company_name} (${room.slug}) — not in BRAND_DATA, skipping`);
      skipped++;
      continue;
    }

    console.log(`🔍 ${room.company_name} (${room.slug}) — ${brand.domain}`);

    // ── Resolve logo ──
    let logoUrl = brand.logo; // manual override first
    let logoSource = "manual-override";

    if (!logoUrl) {
      // Fetch website and extract
      console.log(`   Fetching ${brand.domain}...`);
      const { html, baseUrl } = await fetchHtml(brand.domain);
      const result = await findBestLogo(brand.domain, html, baseUrl);
      logoUrl = result.url;
      logoSource = result.type;
    } else if (logoUrl.startsWith("/")) {
      // Local path (served by Next.js from public/) — no HEAD check needed
      logoSource = "local-file";
    } else {
      // Verify the manual override still works
      const ok = await headCheck(logoUrl);
      if (!ok) {
        console.log(`   ⚠️  Manual logo 404, falling back to fetch...`);
        const { html, baseUrl } = await fetchHtml(brand.domain);
        const result = await findBestLogo(brand.domain, html, baseUrl);
        logoUrl = result.url;
        logoSource = result.type;
      }
    }

    // ── Update Supabase ──
    const update = {
      logo_url: logoUrl,
      brand_primary_color: brand.color,
    };

    const { error: updateError } = await supabase
      .from("rooms")
      .update(update)
      .eq("id", room.id);

    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
    } else {
      console.log(`   ✅ logo: ${logoUrl} [${logoSource}]`);
      console.log(`   ✅ color: ${brand.color}`);
      updated++;
    }
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`✨ Done. ${updated} updated, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
