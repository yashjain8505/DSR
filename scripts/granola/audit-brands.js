#!/usr/bin/env node

/**
 * Audit every company's website to find:
 * 1. The best available logo (apple-touch-icon > large favicon > og:image > header logo img)
 * 2. The true brand color (theme-color meta > manifest > CSS vars > dominant color)
 *
 * Prints a JSON report for each company. Does NOT write to DB.
 */

const COMPANIES = {
  ariai: 'ariai.com',
  cambaytiger: 'cambaytiger.com',
  collectedge: 'collectedge.com',
  flattrade: 'flattrade.in',
  haptik: 'haptik.ai',
  khelomore: 'khelomore.com',
  kiddopia: 'kiddopia.com',
  lovelocal: 'lovelocal.in',
  mathongo: 'mathongo.com',
  sovrenn: 'sovrenn.com',
  wedmegood: 'wedmegood.com',
  zypp: 'zyppelectric.com',
  cars24: 'cars24.com',
  cash247: 'cash247.in',
  fatakpay: 'fatakpay.com',
  kreditpe: 'kredit.pe',
};

function resolveUrl(href, baseUrl) {
  if (!href) return null;
  const decoded = href.replace(/&amp;/g, '&');
  if (decoded.startsWith('http://') || decoded.startsWith('https://')) return decoded;
  if (decoded.startsWith('//')) return `https:${decoded}`;
  if (decoded.startsWith('/')) return `${baseUrl}${decoded}`;
  return `${baseUrl}/${decoded}`;
}

async function fetchHtml(domain) {
  const url = `https://${domain}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    });
    if (!res.ok) return { html: null, baseUrl: url, status: res.status };
    return { html: await res.text(), baseUrl: url, status: 200 };
  } catch (e) {
    // Try www
    try {
      const wwwUrl = `https://www.${domain}`;
      const res = await fetch(wwwUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
      if (res.ok) return { html: await res.text(), baseUrl: wwwUrl, status: 200 };
    } catch {}
    return { html: null, baseUrl: url, error: e.message };
  }
}

async function headCheck(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    });
    const ct = res.headers.get('content-type') || '';
    return { ok: res.ok, status: res.status, isImage: ct.includes('image'), contentType: ct };
  } catch {
    return { ok: false };
  }
}

function findAllLogos(html, baseUrl) {
  const logos = [];

  // 1. apple-touch-icon (best — always 180x180 with solid bg)
  const touchIconPatterns = [
    /rel=["']apple-touch-icon(?:-precomposed)?["'][^>]*href=["']([^"']+)["']/gi,
    /href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon(?:-precomposed)?["']/gi,
  ];
  for (const p of touchIconPatterns) {
    let m;
    while ((m = p.exec(html)) !== null) {
      logos.push({ type: 'apple-touch-icon', url: resolveUrl(m[1], baseUrl) });
    }
  }

  // 2. Large PNG/SVG favicons
  const iconPattern = /<link\s[^>]*?rel=["'](?:icon|shortcut icon)["'][^>]*?>/gi;
  let iconMatch;
  while ((iconMatch = iconPattern.exec(html)) !== null) {
    const tag = iconMatch[0];
    const hrefM = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefM) continue;
    const href = hrefM[1];
    if (href.endsWith('.ico')) continue;
    const sizeM = tag.match(/sizes=["'](\d+)x\d+["']/i);
    const size = sizeM ? parseInt(sizeM[1]) : 32;
    logos.push({ type: `favicon-${size}px`, url: resolveUrl(href, baseUrl), size });
  }

  // 3. og:image
  let ogM = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (!ogM) ogM = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogM) logos.push({ type: 'og:image', url: resolveUrl(ogM[1], baseUrl) });

  // 4. Header/nav logo <img> tags
  const headerM = html.match(/<(?:header|nav)\b[^>]*>[\s\S]*?<\/(?:header|nav)>/gi);
  if (headerM) {
    for (const h of headerM) {
      const imgPattern = /<img[^>]*?src=["']([^"']+)["'][^>]*>/gi;
      let im;
      while ((im = imgPattern.exec(h)) !== null) {
        const src = im[1];
        if (src.startsWith('data:')) continue;
        if (src.includes('pixel') || src.includes('1x1')) continue;
        const fullTag = im[0].toLowerCase();
        const isSrc = src.toLowerCase();
        if (fullTag.includes('logo') || isSrc.includes('logo') || fullTag.includes('brand')) {
          logos.push({ type: 'header-logo-img', url: resolveUrl(src, baseUrl) });
        }
      }
    }
  }

  // 5. Any img with "logo" in src anywhere in page
  const logoImgPattern = /<img[^>]*?src=["']([^"']*logo[^"']*?)["']/gi;
  let lim;
  while ((lim = logoImgPattern.exec(html)) !== null) {
    const src = lim[1];
    if (src.startsWith('data:')) continue;
    logos.push({ type: 'page-logo-img', url: resolveUrl(src, baseUrl) });
  }

  return logos;
}

function findBrandColor(html) {
  const candidates = [];

  // theme-color
  let m = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i);
  if (!m) m = html.match(/<meta[^>]*content=["'](#[0-9a-fA-F]{3,8})["'][^>]*name=["']theme-color["']/i);
  if (m) candidates.push({ source: 'theme-color', color: normalize(m[1]) });

  // msapplication-TileColor
  m = html.match(/<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["'](#[0-9a-fA-F]{3,8})["']/i);
  if (m) candidates.push({ source: 'msapplication-TileColor', color: normalize(m[1]) });

  // CSS custom properties
  const brandVarPattern = /--((?:primary|brand|accent|main|theme)[a-zA-Z0-9-]*)\s*:\s*(#[0-9a-fA-F]{3,8})\b/gi;
  let vm;
  while ((vm = brandVarPattern.exec(html)) !== null) {
    const c = normalize(vm[2]);
    if (isUsable(c)) candidates.push({ source: `css-var --${vm[1]}`, color: c });
  }

  // Background colors on buttons/CTAs
  const btnBgPattern = /(?:background(?:-color)?|bg-\[)\s*[:=]\s*["']?(#[0-9a-fA-F]{6})\b/gi;
  let bm;
  while ((bm = btnBgPattern.exec(html)) !== null) {
    const c = normalize(bm[1]);
    if (isUsable(c)) candidates.push({ source: 'css-bg', color: c });
  }

  // All hex colors frequency analysis
  const hexPattern = /#([0-9a-fA-F]{6})\b/g;
  const counts = new Map();
  let hm;
  while ((hm = hexPattern.exec(html)) !== null) {
    const hex = `#${hm[1].toLowerCase()}`;
    if (isUsable(hex)) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) candidates.push({ source: `dominant (${sorted[0][1]}x)`, color: sorted[0][0] });
  if (sorted.length > 1) candidates.push({ source: `2nd-dominant (${sorted[1][1]}x)`, color: sorted[1][0] });

  return candidates;
}

function normalize(hex) {
  const c = hex.trim();
  if (c.length === 4) return `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`.toLowerCase();
  return c.substring(0, 7).toLowerCase();
}

function isUsable(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const spread = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
  if (spread < 20) return false; // grayscale
  const avg = (rgb.r + rgb.g + rgb.b) / 3;
  if (avg > 230 || avg < 25) return false; // near white/black
  return true;
}

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return null;
  return { r: parseInt(c.substring(0, 2), 16), g: parseInt(c.substring(2, 4), 16), b: parseInt(c.substring(4, 6), 16) };
}

async function auditCompany(slug, domain) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${slug.toUpperCase()} — https://${domain}`);
  console.log('='.repeat(60));

  const { html, baseUrl, status, error } = await fetchHtml(domain);

  if (!html) {
    console.log(`  ❌ Failed to fetch: ${error || `HTTP ${status}`}`);
    return;
  }

  // Logos
  const logos = findAllLogos(html, baseUrl);
  console.log(`\n  LOGOS FOUND (${logos.length}):`);
  const seen = new Set();
  for (const l of logos) {
    if (seen.has(l.url)) continue;
    seen.add(l.url);
    console.log(`    [${l.type}] ${l.url}`);
  }

  // Check well-known paths
  for (const p of ['/apple-touch-icon.png', '/apple-touch-icon-precomposed.png', '/favicon-192x192.png']) {
    const check = await headCheck(`${baseUrl}${p}`);
    if (check.ok && check.isImage) {
      console.log(`    [well-known] ${baseUrl}${p} ✅`);
    }
  }

  // Colors
  const colors = findBrandColor(html);
  console.log(`\n  BRAND COLORS (${colors.length}):`);
  for (const c of colors) {
    console.log(`    [${c.source}] ${c.color}`);
  }
}

async function main() {
  for (const [slug, domain] of Object.entries(COMPANIES)) {
    await auditCompany(slug, domain);
  }
}

main().catch(console.error);
