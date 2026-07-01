/**
 * Utility to extract brand assets (logo + colors) from a company's website
 * and compute color variants for theming.
 *
 * **Brand color strategy (logo-first):**
 * 1. Find the company logo (apple-touch-icon, favicon, etc.)
 * 2. Download the logo image
 * 3. Extract the dominant saturated color from its pixels using `sharp`
 * 4. Fall back to HTML meta tags / CSS vars only if logo extraction fails
 *
 * This is far more reliable than scraping CSS because the logo ALWAYS
 * contains the brand color, regardless of how the website is built.
 */

import sharp from "sharp";

// Re-export client-safe palette utilities so existing server-side
// imports from "@/lib/brand-colors" keep working.
export { computePalette, type BrandPalette } from "./palette";

export interface BrandAssets {
  logoUrl: string | null;
  brandColor: string | null;
  /** Accent color distinct in hue from brandColor (e.g. navy + neon green). */
  secondaryColor: string | null;
}

/**
 * Extract both logo URL and brand color from a company's website.
 * Uses a logo-first approach: finds the logo, then extracts the dominant
 * color from the logo's pixels for the most reliable brand color.
 */
export async function extractBrandAssets(
  websiteUrl: string
): Promise<BrandAssets> {
  const domain = websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const url = `https://${domain}`;

  let html: string | null = null;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (response.ok) {
      html = await response.text();
    }
  } catch {
    // Site unreachable — fall through to fallback strategies
  }

  // Step 1: Find the logo URL
  const logoUrl = await extractLogo(html, domain, url);

  // Step 2: Extract brand color — logo pixels first, HTML fallbacks second
  const brandColor = await extractBrandColor(logoUrl, html, domain, url);

  // Step 3: A secondary accent color — first HTML-declared color that is
  // clearly a different hue than the primary (e.g. Bigul's navy + neon green)
  const secondaryColor = extractSecondaryColor(brandColor, html);

  return { logoUrl, brandColor, secondaryColor };
}

/**
 * Find an accent color distinct in hue from the primary, from the site's
 * declared colors (theme-color meta, CSS brand vars, inline SVG fills).
 */
function extractSecondaryColor(
  primary: string | null,
  html: string | null
): string | null {
  if (!primary || !html) return null;

  const candidates = [
    extractMetaThemeColor(html),
    extractCssVarColor(html),
    extractSvgColor(html),
    extractDominantColor(html),
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      candidate.toLowerCase() !== primary.toLowerCase() &&
      isUsableBrandColor(candidate) &&
      isDistinctHue(primary, candidate)
    ) {
      return candidate;
    }
  }
  return null;
}

/** Whether two hex colors differ in hue by at least 45° (wrap-aware). */
function isDistinctHue(a: string, b: string): boolean {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return false;
  const d = Math.abs(rgbToHsl(ra).h - rgbToHsl(rb).h);
  return Math.min(d, 360 - d) >= 45;
}

/**
 * Derive the website domain from a contact email.
 * e.g. "ria.sengupta@cars24.com" -> "cars24.com"
 * Returns null for generic email providers.
 */
export function domainFromEmail(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  const domain = parts[1].toLowerCase();
  const generic = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "protonmail.com",
    "live.com",
    "aol.com",
    "mail.com",
    "zoho.com",
  ];
  if (generic.includes(domain)) return null;
  return domain;
}

/**
 * Guess the company domain from a slug or company name.
 *
 * Tries `{slug}.com` first, then `.in`, `.io`, `.app` — returns the first
 * one that responds with HTTP 200 (HEAD request, 4s timeout). Returns null
 * if nothing works. This is the fallback when there's no contact_email.
 */
export async function domainFromSlug(
  slug: string
): Promise<string | null> {
  // Normalise: "Cambay Tiger" → "cambaytiger", "R for Rabbit" → "rforrabbit"
  const base = slug
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!base) return null;

  const candidates = [
    `${base}.com`,
    `${base}.in`,
    `${base}.io`,
    `${base}.app`,
    `${base}.co`,
  ];

  for (const domain of candidates) {
    try {
      const res = await fetch(`https://${domain}`, {
        method: "HEAD",
        signal: AbortSignal.timeout(4000),
        redirect: "follow",
      });
      if (res.ok) return domain;
    } catch {
      continue;
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Logo extraction                                                      */
/* ------------------------------------------------------------------ */

/**
 * Try to extract the company logo URL using multiple strategies.
 *
 * Icons with solid backgrounds are preferred because the hero section
 * shows the logo inside a white pill container — white-on-transparent
 * logos (common in dark navbars) would be invisible.
 *
 * Priority:
 *  1. <link rel="apple-touch-icon"> (always has solid bg, square 180px)
 *  2. Well-known path: /apple-touch-icon.png
 *  3. <link rel="icon" type="image/png"> with largest size (≥64px)
 *  4. Google Favicon API (128px, always works, solid bg)
 *
 * Note: <img> tags with "logo" and og:image are intentionally skipped.
 * They're typically white-on-transparent header wordmarks that break
 * on our white hero background.
 */
/**
 * Curated, hand-picked high-resolution logos for specific customer domains,
 * self-hosted in our Supabase `assets` bucket. Auto-extraction only finds
 * low-res favicons (or the wrong App Store icon) for these, so they take
 * priority and survive room regeneration. Keyed by bare domain (no www).
 */
const CURATED_LOGOS: Record<string, string> = {
  "khelomore.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/khelomore.png",
  "sidsfarm.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/sids-farm.png",
  "rforrabbit.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/r-for-rabbit.png",
  "hudle.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/hudle.png",
  "gimbooks.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/gimbooks.png",
  "nuramobility.co.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/nura-mobility.png",
  "fitpass.co.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/fitpass.png",
  "chatspark.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/chatspark.png",
  "prefr.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/prefr.png",
  "hizuno.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/zuno.png",
  "giottus.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/giottus.png",
  "getswipe.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/swipe.png",
  "tractorjunction.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/tractor-junction.png",
  "wework.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/wework.png",
  "vivamoney.in":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/viva-money.png",
  "savart.com":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/savart.png",
  "currently.club":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/currently.png",
  "dailyrounds.org":
    "https://iubstoakzckephkspsys.supabase.co/storage/v1/object/public/assets/logos/dailyrounds.png",
  // vama.app: pending the correct logo upload from the team.
};

async function extractLogo(
  html: string | null,
  domain: string,
  baseUrl: string
): Promise<string | null> {
  // Curated logos win over auto-extraction and survive regeneration.
  const curated = CURATED_LOGOS[domain.replace(/^www\./, "").toLowerCase()];
  if (curated) return curated;

  if (html) {
    // Strategy 1: apple-touch-icon (always a clean square icon with solid bg)
    const touchIcon = extractLinkHref(
      html,
      /rel=["']apple-touch-icon["']/i,
      baseUrl
    );
    if (touchIcon) return touchIcon;

    // Strategy 2: PNG/SVG favicon ≥ 64px (large enough to look good)
    const pngIcon = extractLargestIcon(html, baseUrl, 64);
    if (pngIcon) return pngIcon;

    // Strategy 2.5: any <link rel="icon"> regardless of declared type/sizes —
    // download it and measure the actual pixels. Catches sites that serve a
    // high-res PNG behind type="image/x-icon" or no sizes attribute at all.
    const anyIcon = extractLinkHref(
      html,
      /rel=["'](?:shortcut\s+)?icon["']/i,
      baseUrl
    );
    if (anyIcon && (await imageMeetsMinSize(anyIcon, 64))) return anyIcon;
  }

  // Strategy 3: Try well-known path /apple-touch-icon.png
  const wellKnown = await tryFetchUrl(
    `${baseUrl}/apple-touch-icon.png`,
    "image/"
  );
  if (wellKnown) return wellKnown;

  // Strategy 4: Google Favicon API — validated; it 404s for domains Google
  // hasn't indexed, and storing that URL renders a broken image in the room.
  return await tryFetchUrl(
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    "image/"
  );
}

/**
 * Download an image and check its real dimensions with sharp.
 * SVGs pass unconditionally (vectors scale to any size).
 */
async function imageMeetsMinSize(
  url: string,
  minSize: number
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(6000),
      redirect: "follow",
    });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    if (meta.format === "svg") return true;
    return (meta.width ?? 0) >= minSize && (meta.height ?? 0) >= minSize;
  } catch {
    return false;
  }
}

/**
 * Find <img> tags where src, alt, or class contains "logo".
 * Returns the src of the best match.
 */
function extractLogoFromImgTags(html: string, baseUrl: string): string | null {
  // Match img tags — use a broad pattern to capture attributes
  const imgPattern =
    /<img\s[^>]*?(?:src|alt|class)\s*=\s*["'][^"']*logo[^"']*["'][^>]*?\/?>/gi;
  const matches = html.match(imgPattern);
  if (!matches || matches.length === 0) return null;

  // Prefer matches where "logo" is in the src (more reliable)
  for (const tag of matches) {
    const srcMatch = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch) {
      const src = srcMatch[1];
      // Skip tiny tracking pixels or data URIs
      if (src.startsWith("data:")) continue;
      if (src.includes("1x1") || src.includes("pixel")) continue;
      return resolveUrl(src, baseUrl);
    }
  }

  return null;
}

/**
 * Extract href from a <link> tag matching the given rel pattern.
 */
function extractLinkHref(
  html: string,
  relPattern: RegExp,
  baseUrl: string
): string | null {
  // Try: <link rel="..." href="...">
  const pattern1 = new RegExp(
    `<link\\s[^>]*?${relPattern.source}[^>]*?href=["']([^"']+)["']`,
    "i"
  );
  const m1 = html.match(pattern1);
  if (m1) return resolveUrl(m1[1], baseUrl);

  // Try reversed order: <link href="..." rel="...">
  const pattern2 = new RegExp(
    `<link\\s[^>]*?href=["']([^"']+)["'][^>]*?${relPattern.source}`,
    "i"
  );
  const m2 = html.match(pattern2);
  if (m2) return resolveUrl(m2[1], baseUrl);

  return null;
}

/**
 * Find the largest PNG/SVG <link rel="icon"> in the HTML.
 * @param minSize Minimum icon size in px to consider (default 0).
 */
function extractLargestIcon(html: string, baseUrl: string, minSize = 0): string | null {
  const iconPattern =
    /<link\s[^>]*?rel=["'](?:icon|shortcut icon)["'][^>]*?>/gi;
  const iconTags = html.match(iconPattern);
  if (!iconTags) return null;

  let bestHref: string | null = null;
  let bestSize = 0;

  for (const tag of iconTags) {
    // Only consider PNG/SVG (skip .ico)
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;

    const href = hrefMatch[1];
    const type = typeMatch?.[1] ?? "";

    if (
      href.endsWith(".ico") ||
      (type && !type.includes("png") && !type.includes("svg"))
    ) {
      continue;
    }

    // Parse sizes="NxN"
    const sizeMatch = tag.match(/sizes=["'](\d+)x\d+["']/i);
    const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 32;

    if (size >= minSize && size > bestSize) {
      bestSize = size;
      bestHref = resolveUrl(href, baseUrl);
    }
  }

  return bestHref;
}

/**
 * Extract content from a <meta> tag matching the given pattern.
 */
function extractMetaContent(
  html: string,
  namePattern: RegExp,
  baseUrl: string
): string | null {
  const p1 = new RegExp(
    `<meta\\s[^>]*?${namePattern.source}[^>]*?content=["']([^"']+)["']`,
    "i"
  );
  const m1 = html.match(p1);
  if (m1) return resolveUrl(m1[1], baseUrl);

  const p2 = new RegExp(
    `<meta\\s[^>]*?content=["']([^"']+)["'][^>]*?${namePattern.source}`,
    "i"
  );
  const m2 = html.match(p2);
  if (m2) return resolveUrl(m2[1], baseUrl);

  return null;
}

/**
 * Check if a URL returns a valid response with the expected content type.
 */
async function tryFetchUrl(
  url: string,
  expectedContentType: string
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(4000),
      redirect: "follow",
    });
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes(expectedContentType)) return url;
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolve a potentially-relative URL against the base URL.
 * Also decodes HTML entities (&amp; -> &) that appear in scraped HTML.
 */
function resolveUrl(href: string, baseUrl: string): string {
  // Decode common HTML entities that break URLs
  const decoded = href.replace(/&amp;/g, "&").replace(/&#x2F;/g, "/");
  if (decoded.startsWith("http://") || decoded.startsWith("https://"))
    return decoded;
  if (decoded.startsWith("//")) return `https:${decoded}`;
  if (decoded.startsWith("/")) return `${baseUrl}${decoded}`;
  return `${baseUrl}/${decoded}`;
}

/* ------------------------------------------------------------------ */
/* Brand color extraction                                               */
/* ------------------------------------------------------------------ */

/**
 * Try to extract the primary brand color using multiple strategies.
 * Priority:
 *  1. <meta name="theme-color">
 *  2. <meta name="msapplication-TileColor">
 *  3. manifest.json theme_color
 *  4. CSS custom properties named with "primary", "brand", or "accent"
 *  5. SVG fill/stroke colors
 *  6. Dominant non-grayscale color from inline styles and CSS blocks
 */
/**
 * Extract brand color using a logo-first approach:
 *
 * 1. Download the logo image and extract dominant color via sharp (most reliable)
 * 2. Fall back to HTML meta/CSS strategies if logo extraction fails
 *
 * The logo always contains the brand color regardless of how the site is built,
 * making this far more reliable than scraping CSS from SPAs.
 */
async function extractBrandColor(
  logoUrl: string | null,
  html: string | null,
  domain: string,
  baseUrl: string
): Promise<string | null> {
  // === PRIMARY: Extract color from logo image pixels ===
  if (logoUrl) {
    const logoColor = await extractColorFromImage(logoUrl);
    if (logoColor) return logoColor;
  }

  // Try apple-touch-icon directly (even if not the chosen logo)
  const touchIconUrls = [
    `${baseUrl}/apple-touch-icon.png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
  for (const iconUrl of touchIconUrls) {
    if (iconUrl === logoUrl) continue; // Already tried
    const iconColor = await extractColorFromImage(iconUrl);
    if (iconColor) return iconColor;
  }

  // === FALLBACK: HTML-based strategies (less reliable) ===
  if (html) {
    const themeColor = extractMetaThemeColor(html);
    if (themeColor && isUsableBrandColor(themeColor)) return themeColor;

    const cssVarColor = extractCssVarColor(html);
    if (cssVarColor) return cssVarColor;

    const svgColor = extractSvgColor(html);
    if (svgColor) return svgColor;

    const dominantColor = extractDominantColor(html);
    if (dominantColor) return dominantColor;
  }

  const manifestColor = await extractManifestColor(baseUrl);
  if (manifestColor) return manifestColor;

  return null;
}

/**
 * Check if a color is usable as a brand color (not too dark, not too light,
 * not grayscale, has enough saturation).
 */
function isUsableBrandColor(hex: string): boolean {
  return !isGrayscale(hex) && !isNearWhiteOrBlack(hex) && !isLowSaturation(hex);
}

/**
 * Download an image and extract the dominant brand color from its pixels
 * using `sharp`. Resizes to 64x64 for speed, then counts quantized color
 * frequencies, returning the most common saturated color.
 */
async function extractColorFromImage(
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;

    const ct = res.headers.get("content-type") ?? "";

    // For SVGs, fall back to text-based extraction
    if (ct.includes("svg")) {
      const svgText = await res.text();
      return extractSvgColor(svgText);
    }

    // For HTML responses (e.g. Google favicon returning error page), skip
    if (ct.includes("text/html")) return null;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 100) return null;

    // Use sharp to decode ANY image format and get raw RGB pixels
    const { data, info } = await sharp(buffer)
      .resize(64, 64, { fit: "cover" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Count quantized colors
    const colorCounts = new Map<string, number>();
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Skip white, black, near-white, near-black, grayscale
      const avg = (r + g + b) / 3;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (avg > 230 || avg < 25 || spread < 30) continue;

      // Quantize to nearest 16 to group similar shades
      const qr = Math.min(255, Math.round(r / 16) * 16);
      const qg = Math.min(255, Math.round(g / 16) * 16);
      const qb = Math.min(255, Math.round(b / 16) * 16);
      const hex = `#${qr.toString(16).padStart(2, "0")}${qg.toString(16).padStart(2, "0")}${qb.toString(16).padStart(2, "0")}`;

      colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
    }

    if (colorCounts.size === 0) return null;

    // Sort by frequency and return the most common usable color
    const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
    for (const [color] of sorted) {
      if (isUsableBrandColor(color)) return color;
    }

    return null;
  } catch {
    return null;
  }
}

function extractMetaThemeColor(html: string): string | null {
  const match = html.match(
    /<meta[^>]*name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i
  );
  if (match) return normalizeHex(match[1]);

  const match2 = html.match(
    /<meta[^>]*content=["'](#[0-9a-fA-F]{3,8})["'][^>]*name=["']theme-color["']/i
  );
  if (match2) return normalizeHex(match2[1]);

  return null;
}

function extractMetaTileColor(html: string): string | null {
  const match = html.match(
    /<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i
  );
  if (match) return normalizeHex(match[1]);
  return null;
}

/**
 * Look for CSS custom properties that suggest brand colors:
 *   --primary-color, --brand-color, --accent-color, --color-primary, etc.
 */
function extractCssVarColor(html: string): string | null {
  const brandVarPattern =
    /--((?:primary|brand|accent|main|theme)[a-zA-Z0-9-]*(?:color)?|(?:color-)?(?:primary|brand|accent|main|theme))\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;

  const matches: { name: string; color: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = brandVarPattern.exec(html)) !== null) {
    const color = normalizeHex(m[2]);
    const rgb = hexToRgb(color);
    if (!rgb) continue;
    if (isGrayscale(color) || isNearWhiteOrBlack(color)) continue;
    matches.push({ name: m[1], color });
  }

  if (matches.length === 0) return null;

  // Prefer variables with "primary" or "brand" over "accent"
  const primary = matches.find(
    (m) => m.name.includes("primary") || m.name.includes("brand")
  );
  return primary ? primary.color : matches[0].color;
}

/**
 * Extract the most prominent fill color from inline SVG elements.
 * SVG logos and icons often directly use the brand color.
 */
function extractSvgColor(html: string): string | null {
  // Find fill= and stroke= attributes in SVG elements
  const svgSection = html.match(/<svg[\s\S]*?<\/svg>/gi);
  if (!svgSection) return null;

  const colorCounts = new Map<string, number>();
  const hexPattern = /#([0-9a-fA-F]{6})\b/g;

  for (const svg of svgSection) {
    let m: RegExpExecArray | null;
    while ((m = hexPattern.exec(svg)) !== null) {
      const hex = `#${m[1].toLowerCase()}`;
      if (isGrayscale(hex) || isNearWhiteOrBlack(hex)) continue;
      colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
    }
  }

  if (colorCounts.size === 0) return null;

  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/**
 * Find all hex colors in the HTML and return the most frequently
 * occurring non-grayscale, non-near-white/black color.
 * Improved: filters out low-saturation colors and weights
 * colors found in prominent positions higher.
 */
function extractDominantColor(html: string): string | null {
  const hexPattern = /#([0-9a-fA-F]{6})\b/g;
  const colorCounts = new Map<string, number>();

  let m: RegExpExecArray | null;
  while ((m = hexPattern.exec(html)) !== null) {
    const hex = `#${m[1].toLowerCase()}`;
    if (isGrayscale(hex)) continue;
    if (isNearWhiteOrBlack(hex)) continue;
    if (isLowSaturation(hex)) continue;
    colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
  }

  if (colorCounts.size === 0) return null;

  // Return the most frequently occurring saturated color
  const sorted = [...colorCounts.entries()].sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}

/**
 * Try fetching /manifest.json or /site.webmanifest for theme_color.
 */
async function extractManifestColor(baseUrl: string): Promise<string | null> {
  const manifestPaths = ["/manifest.json", "/site.webmanifest"];

  for (const path of manifestPaths) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(4000),
        redirect: "follow",
      });
      if (!res.ok) continue;

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("json") && !ct.includes("manifest")) continue;

      const json = await res.json();
      if (json.theme_color && typeof json.theme_color === "string") {
        const hex = normalizeHex(json.theme_color);
        const rgb = hexToRgb(hex);
        if (rgb && !isGrayscale(hex) && !isNearWhiteOrBlack(hex)) {
          return hex;
        }
      }
      if (json.background_color && typeof json.background_color === "string") {
        const hex = normalizeHex(json.background_color);
        const rgb = hexToRgb(hex);
        if (rgb && !isGrayscale(hex) && !isNearWhiteOrBlack(hex)) {
          return hex;
        }
      }
    } catch {
      continue;
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Color helpers                                                        */
/* ------------------------------------------------------------------ */

function isGrayscale(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  return spread < 20;
}

function isNearWhiteOrBlack(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  return avg > 230 || avg < 25;
}

/**
 * Reject muddy/low-saturation colors (like #62748e) that aren't
 * distinctive enough to be brand colors.
 */
function isLowSaturation(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const delta = max - min;

  // HSL saturation calculation
  if (max === 0) return true;

  const lightness = (max + min) / 2;
  const saturation =
    lightness > 127
      ? delta / (510 - max - min)
      : delta / (max + min);

  // Reject colors with saturation below ~18%
  return saturation < 0.18;
}

function normalizeHex(hex: string): string {
  const cleaned = hex.trim();
  if (cleaned.length === 4) {
    return `#${cleaned[1]}${cleaned[1]}${cleaned[2]}${cleaned[2]}${cleaned[3]}${cleaned[3]}`;
  }
  // Take only the first 7 chars (#RRGGBB) if longer (e.g. #RRGGBBAA)
  return cleaned.substring(0, 7).toLowerCase();
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function mixWithWhite(rgb: RGB, alpha: number): RGB {
  return {
    r: Math.round(rgb.r * alpha + 255 * (1 - alpha)),
    g: Math.round(rgb.g * alpha + 255 * (1 - alpha)),
    b: Math.round(rgb.b * alpha + 255 * (1 - alpha)),
  };
}

function darken(rgb: RGB, amount: number): RGB {
  return {
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  };
}

interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

function hslToRgb(hsl: HSL): RGB {
  const { s, l } = hsl;
  const h = hsl.h / 360;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}
