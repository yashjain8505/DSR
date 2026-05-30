/**
 * Meeting-brief structure layer.
 *
 * Briefs are stored as a single markdown string in `meeting_briefs.content`.
 * This module parses that markdown into a small, predictable structure so the
 * prospect page can render it as visual sections and the admin can edit it
 * section-by-section — then serializes the structure back to markdown for
 * storage. The DB shape is unchanged; structure lives only in transit.
 *
 * Briefs that don't fit the structure (no snapshot, fewer than two recognized
 * sections) are left as raw markdown via the `hasStructure` gate, so atypical
 * content is never mangled.
 */

export interface BriefSnapshot {
  date: string;
  attendees: string;
}

export interface BriefSection {
  /** Stable key — canonical key (e.g. "pain_points") or a slug for extras. */
  key: string;
  title: string;
  /** Numbered list vs. bulleted — preserved from the source. */
  ordered: boolean;
  items: string[];
}

export interface BriefData {
  snapshot: BriefSnapshot | null;
  sections: BriefSection[];
}

/**
 * The fixed set of sections we recognize, in display order. Each `match` is
 * tested against a detected header; the first match wins. Anything unmatched
 * is preserved as an "extra" section so no content is lost.
 */
export const CANONICAL_SECTIONS: {
  key: string;
  title: string;
  match: RegExp;
}[] = [
  { key: "situation", title: "Their Situation", match: /situation|background|context|current\s+(state|setup)|about\s+(them|the\s+company)/i },
  { key: "pain_points", title: "Pain Points", match: /pain|challenge|problem|frustrat/i },
  { key: "what_we_showed", title: "What We Showed You", match: /what\s+we\s+showed|showed\s+them|we\s+(demo|covered|walked)|demo(nstrat)?|covered\s+in/i },
  { key: "security", title: "Security & Compliance", match: /security|compliance|privacy|soc\s?2|gdpr|iso\b/i },
  { key: "why_it_matters", title: "Why It Matters", match: /why\s+(it\s+)?matters|why\s+linkrunner|value|outcome|impact|fit\b|results?/i },
];

const CANONICAL_ORDER = new Map(
  CANONICAL_SECTIONS.map((s, i) => [s.key, i]),
);

/** Detect whether a line is a section header; return its text, else null. */
function headerText(line: string): string | null {
  const t = line.trim();
  if (!t) return null;
  // List items are never headers.
  if (/^([-*•]|\d+[.)])\s+/.test(t)) return null;

  // Markdown heading: # .. ######
  const md = t.match(/^#{1,6}\s+(.+?)\s*$/);
  if (md) return cleanHeader(md[1]);

  // A line that is entirely bold: **Heading**
  const bold = t.match(/^\*\*(.+?)\*\*:?$/);
  if (bold) return cleanHeader(bold[1]);

  // ALL-CAPS label line, optionally followed by "— extra" / ": extra".
  // The leading segment (before — / – / :) must be uppercase.
  const seg = t.split(/[—–:]| - /)[0].trim();
  const letters = seg.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 3 && seg === seg.toUpperCase()) {
    return cleanHeader(seg);
  }
  return null;
}

function cleanHeader(s: string): string {
  return s.replace(/[*_#:]+$/g, "").replace(/^[*_#]+/g, "").trim();
}

/** Strip a leading list marker (-, *, •, "1.", "[ ]") from a line. */
function stripMarker(line: string): { text: string; ordered: boolean } {
  let t = line.trim();
  let ordered = false;
  const numbered = t.match(/^(\d+)[.)]\s+(.*)$/);
  if (numbered) {
    ordered = true;
    t = numbered[2];
  } else {
    t = t.replace(/^[-*•]\s+/, "");
  }
  // Drop markdown checkbox syntax: [ ] / [x]
  t = t.replace(/^\[[ xX]\]\s*/, "");
  return { text: t.trim(), ordered };
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isSnapshotHeader(h: string): boolean {
  return /summary|snapshot|overview|recap|attendees/i.test(h);
}

interface RawBlock {
  header: string | null;
  lines: string[];
}

/** Parse a brief's markdown content into structured data. */
export function parseBrief(content: string): BriefData {
  const lines = (content ?? "").replace(/\r\n/g, "\n").split("\n");

  // Group lines into blocks delimited by detected headers.
  const blocks: RawBlock[] = [];
  let current: RawBlock = { header: null, lines: [] };
  for (const line of lines) {
    const h = headerText(line);
    if (h !== null) {
      if (current.header !== null || current.lines.some((l) => l.trim())) {
        blocks.push(current);
      }
      current = { header: h, lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.header !== null || current.lines.some((l) => l.trim())) {
    blocks.push(current);
  }

  let snapshot: BriefSnapshot | null = null;
  const sections: BriefSection[] = [];

  for (const block of blocks) {
    const bodyLines = block.lines.filter((l) => l.trim());
    const isSnapshot =
      (block.header !== null && isSnapshotHeader(block.header)) ||
      (snapshot === null &&
        sections.length === 0 &&
        bodyLines.some((l) => /^(date|attendees|participants)\s*:/i.test(l.trim())));

    if (isSnapshot) {
      const date = matchField(bodyLines, /^date\s*:\s*(.+)$/i);
      const attendees =
        matchField(bodyLines, /^attendees\s*:\s*(.+)$/i) ||
        matchField(bodyLines, /^participants\s*:\s*(.+)$/i);
      if (date || attendees) {
        snapshot = { date: date ?? "", attendees: attendees ?? "" };
      }
      continue;
    }

    if (block.header === null) continue; // stray pre-header prose — ignored (fallback gate handles it)

    // Extract list / line items.
    let orderedVotes = 0;
    const items: string[] = [];
    for (const l of bodyLines) {
      const { text, ordered } = stripMarker(l);
      if (!text) continue;
      if (ordered) orderedVotes++;
      items.push(text);
    }
    if (items.length === 0) continue;

    const canonical = CANONICAL_SECTIONS.find((c) => c.match.test(block.header!));
    sections.push({
      key: canonical?.key ?? slug(block.header),
      title: canonical?.title ?? titleCase(block.header),
      ordered: orderedVotes > items.length / 2,
      items,
    });
  }

  // Canonical sections first (in defined order), extras after in source order.
  sections.sort((a, b) => {
    const ai = CANONICAL_ORDER.has(a.key)
      ? CANONICAL_ORDER.get(a.key)!
      : CANONICAL_SECTIONS.length;
    const bi = CANONICAL_ORDER.has(b.key)
      ? CANONICAL_ORDER.get(b.key)!
      : CANONICAL_SECTIONS.length;
    return ai - bi;
  });

  return { snapshot, sections };
}

function matchField(lines: string[], re: RegExp): string | null {
  for (const l of lines) {
    const m = l.trim().match(re);
    if (m) return m[1].trim();
  }
  return null;
}

/**
 * Whether a parsed brief has enough structure to render/edit as sections.
 * Below this bar we keep the raw markdown so unusual briefs aren't mangled.
 */
export function hasStructure(data: BriefData): boolean {
  return data.snapshot !== null || data.sections.length >= 2;
}

/** Serialize structured brief data back to canonical markdown for storage. */
export function serializeBrief(data: BriefData): string {
  const parts: string[] = [];

  if (data.snapshot && (data.snapshot.date || data.snapshot.attendees)) {
    const lines = ["## Meeting Summary"];
    if (data.snapshot.date) lines.push(`Date: ${data.snapshot.date}`);
    if (data.snapshot.attendees) lines.push(`Attendees: ${data.snapshot.attendees}`);
    parts.push(lines.join("\n"));
  }

  for (const section of data.sections) {
    const items = section.items.map((i) => i.trim()).filter(Boolean);
    if (items.length === 0) continue;
    const body = items
      .map((it, i) => (section.ordered ? `${i + 1}. ${it}` : `- ${it}`))
      .join("\n");
    parts.push(`## ${section.title}\n${body}`);
  }

  return parts.join("\n\n");
}

/** Parse the next-steps markdown into a flat list of step strings. */
export function parseNextSteps(content: string): string[] {
  return (content ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !headerText(l)) // drop any stray heading lines
    .map((l) => stripMarker(l).text)
    .filter(Boolean);
}

/** Serialize a list of step strings back to markdown for storage. */
export function serializeNextSteps(items: string[]): string {
  return items
    .map((i) => i.trim())
    .filter(Boolean)
    .map((i) => `- ${i}`)
    .join("\n");
}
