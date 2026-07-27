/**
 * Read upcoming meetings from a calendar's secret iCal (.ics) feed.
 *
 * No Google login / Cloud project: the user pastes their calendar's private
 * "Secret address in iCal format" URL into CALENDAR_ICS_URL, and this fetches
 * and parses it. Server-only. Hand-rolled parser (no ics dependency).
 *
 * Timezone handling: DTSTART values ending in "Z" are UTC (exact). Values with
 * a TZID use that zone's TZOFFSETTO from the feed's VTIMEZONE block. Anything
 * else (floating) falls back to CALENDAR_DEFAULT_TZ_OFFSET_MIN (default IST,
 * +330). This is exact for non-DST zones like IST; near a DST transition in
 * other zones it could be off by an hour — fine for this India-based team.
 */

export interface UpcomingEvent {
  id: string;
  title: string;
  startMs: number;
  attendeeEmails: string[];
}
export type CalendarResult =
  | { ok: true; events: UpcomingEvent[] }
  | { ok: false; error: string };

const DEFAULT_OFFSET_MIN = Number(process.env.CALENDAR_DEFAULT_TZ_OFFSET_MIN ?? 330);

export function calendarConfigured(): boolean {
  return Boolean(process.env.CALENDAR_ICS_URL);
}

/** "+0530" / "-0400" → minutes east of UTC. */
function parseOffset(s: string): number | null {
  const m = s.trim().match(/^([+-])(\d{2})(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) * 60 + parseInt(m[3], 10));
}

/** Convert a DTSTART property (params + value) to a UTC epoch ms, or null. */
function dtstartToMs(params: string, value: string, tzOffsets: Map<string, number>): number | null {
  if (/VALUE=DATE\b/i.test(params)) return null; // all-day, no precise time
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s, z] = m;
  const utcMs = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s);
  if (z === "Z") return utcMs; // already UTC

  let offsetMin = DEFAULT_OFFSET_MIN;
  const tzid = params.match(/TZID=([^;:]+)/i)?.[1];
  if (tzid && tzOffsets.has(tzid)) offsetMin = tzOffsets.get(tzid)!;
  // local = UTC + offset  =>  UTC = local - offset
  return utcMs - offsetMin * 60_000;
}

/** RFC5545 line unfolding: a leading space/tab continues the previous line. */
function unfold(text: string): string[] {
  const raw = text.split(/\r\n|\n|\r/);
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

export async function fetchUpcomingEvents(fromMs: number, toMs: number): Promise<CalendarResult> {
  const url = process.env.CALENDAR_ICS_URL;
  if (!url) return { ok: false, error: "CALENDAR_ICS_URL not configured" };

  let text: string;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return { ok: false, error: `iCal fetch ${res.status}` };
    text = await res.text();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "iCal fetch failed" };
  }

  const lines = unfold(text);

  // First pass: TZID -> offset minutes (first TZOFFSETTO seen per VTIMEZONE).
  const tzOffsets = new Map<string, number>();
  let curTzid: string | null = null;
  for (const line of lines) {
    if (line.startsWith("BEGIN:VTIMEZONE")) curTzid = null;
    else if (line.startsWith("TZID:") && curTzid === null) curTzid = line.slice(5).trim();
    else if (line.startsWith("TZOFFSETTO:") && curTzid && !tzOffsets.has(curTzid)) {
      const off = parseOffset(line.slice("TZOFFSETTO:".length));
      if (off !== null) tzOffsets.set(curTzid, off);
    } else if (line.startsWith("END:VTIMEZONE")) curTzid = null;
  }

  // Second pass: VEVENTs.
  const events: UpcomingEvent[] = [];
  let inEvent = false;
  let uid = "";
  let summary = "";
  let status = "";
  let startMs: number | null = null;
  const attendees: string[] = [];

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      inEvent = true;
      uid = summary = status = "";
      startMs = null;
      attendees.length = 0;
      continue;
    }
    if (line.startsWith("END:VEVENT")) {
      inEvent = false;
      if (
        status !== "CANCELLED" &&
        startMs !== null &&
        startMs >= fromMs &&
        startMs < toMs &&
        attendees.length > 0
      ) {
        events.push({ id: uid || `${startMs}`, title: summary || "(untitled meeting)", startMs, attendeeEmails: [...attendees] });
      }
      continue;
    }
    if (!inEvent) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const key = name.split(";")[0].toUpperCase();

    if (key === "UID") uid = value.trim();
    else if (key === "SUMMARY") summary = value.trim();
    else if (key === "STATUS") status = value.trim().toUpperCase();
    else if (key === "DTSTART") startMs = dtstartToMs(name, value.trim(), tzOffsets);
    else if (key === "ATTENDEE") {
      const email = value.match(/mailto:([^;\s]+)/i)?.[1]?.toLowerCase();
      if (email && !email.endsWith("@linkrunner.io")) attendees.push(email);
    }
  }

  return { ok: true, events };
}
