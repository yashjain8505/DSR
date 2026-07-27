/**
 * Pre-call prep doc: given a calendar attendee's email, find their DSR room and
 * summarize what they did in it, so a rep gets a briefing before the call.
 *
 * Server-only (uses the admin Supabase client). Reuses the analytics-format
 * helpers so the "where they spent time" breakdown matches the dashboard.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { domainFromEmail } from "./brand-colors";
import {
  sectionBreakdown,
  describeActivityEvent,
  displayActiveTime,
  formatDuration,
  type TimedEvent,
} from "./analytics-format";
import { displayNameFromEmail } from "./session-summary";

interface RoomRow {
  id: string;
  slug: string;
  company_name: string;
  contact_email: string | null;
}

/**
 * Find the DSR room a meeting attendee belongs to. Prefers a room the visitor
 * has actually opened; otherwise falls back to an exact/domain match on
 * room_access or rooms.contact_email. Returns null if nothing matches.
 */
export async function findRoomForEmail(
  admin: SupabaseClient,
  email: string
): Promise<RoomRow | null> {
  const e = email.trim().toLowerCase();
  if (!e.includes("@")) return null;
  const domain = e.split("@")[1];

  // 1. Best signal: a visitor with this email who has actually opened a room.
  const { data: visitor } = await admin
    .from("visitors")
    .select("id")
    .eq("email", e)
    .maybeSingle();
  if (visitor) {
    const { data: visits } = await admin
      .from("room_visits")
      .select("room_id, last_visited_at")
      .eq("visitor_id", visitor.id)
      .order("last_visited_at", { ascending: false });
    const roomId = visits?.[0]?.room_id;
    if (roomId) {
      const { data: room } = await admin
        .from("rooms")
        .select("id, slug, company_name, contact_email")
        .eq("id", roomId)
        .maybeSingle();
      if (room) return room as RoomRow;
    }
  }

  // 2. room_access allowlist: exact email, "@domain", or bare "domain".
  const { data: access } = await admin
    .from("room_access")
    .select("room_id, email")
    .or(`email.eq.${e},email.eq.@${domain},email.eq.${domain}`);
  const accessRoomId = access?.[0]?.room_id;
  if (accessRoomId) {
    const { data: room } = await admin
      .from("rooms")
      .select("id, slug, company_name, contact_email")
      .eq("id", accessRoomId)
      .maybeSingle();
    if (room) return room as RoomRow;
  }

  // 3. A room whose contact_email is this person or shares their (non-generic) domain.
  const brandDomain = domainFromEmail(e); // null for gmail/yahoo/etc.
  const { data: rooms } = await admin
    .from("rooms")
    .select("id, slug, company_name, contact_email")
    .not("contact_email", "is", null);
  for (const room of (rooms ?? []) as RoomRow[]) {
    const ce = (room.contact_email ?? "").toLowerCase();
    if (!ce) continue;
    if (ce === e) return room;
    if (brandDomain && ce.split("@")[1] === brandDomain) return room;
  }

  return null;
}

interface RoomMatch {
  id: string;
  slug: string;
  company_name: string;
}

/**
 * Resolve a free-text Slack query ("PayMe India", "payme-india",
 * "vaibhav@paymeindia.in") to a room. Tries email first, then exact slug, then
 * a company-name / slug contains-match. Returns the candidates for disambiguation.
 */
export async function findRoomByQuery(
  admin: SupabaseClient,
  query: string
): Promise<{ match: RoomMatch | null; candidates: RoomMatch[] }> {
  const q = query.trim();
  if (!q) return { match: null, candidates: [] };

  if (q.includes("@")) {
    const room = await findRoomForEmail(admin, q);
    return { match: room ? { id: room.id, slug: room.slug, company_name: room.company_name } : null, candidates: [] };
  }

  // Exact slug wins outright.
  const { data: exact } = await admin
    .from("rooms")
    .select("id, slug, company_name")
    .eq("slug", q.toLowerCase())
    .maybeSingle();
  if (exact) return { match: exact as RoomMatch, candidates: [] };

  // Contains-match on company name or slug.
  const like = `%${q}%`;
  const { data: rows } = await admin
    .from("rooms")
    .select("id, slug, company_name")
    .or(`company_name.ilike.${like},slug.ilike.${like}`)
    .limit(6);
  const candidates = (rows ?? []) as RoomMatch[];
  return { match: candidates.length === 1 ? candidates[0] : null, candidates };
}

export interface RoomPrepVisitor {
  name: string;
  activeTimeLabel: string;
  topSections: string;
}

export interface RoomPrep {
  company: string;
  slug: string;
  visitors: RoomPrepVisitor[];
}

/**
 * Company-level prep: every (non-internal) visitor who has activity in the room,
 * most-engaged first, each with their active time and top sections. This is what
 * a rep gets from `/prep <company>` — who from the company did what in the room.
 */
export async function buildRoomPrep(
  admin: SupabaseClient,
  room: { id: string; slug: string; company_name: string }
): Promise<RoomPrep> {
  const { data: rawEvents } = await admin
    .from("analytics_events")
    .select("visitor_id, event_type, event_data")
    .eq("room_id", room.id)
    .not("visitor_id", "is", null)
    .limit(5000);

  const byVisitor = new Map<string, { event_type: string; event_data: Record<string, unknown> | null }[]>();
  for (const e of (rawEvents ?? []) as { visitor_id: string; event_type: string; event_data: Record<string, unknown> | null }[]) {
    (byVisitor.get(e.visitor_id) ?? byVisitor.set(e.visitor_id, []).get(e.visitor_id)!).push(e);
  }
  if (byVisitor.size === 0) return { company: room.company_name, slug: room.slug, visitors: [] };

  const ids = [...byVisitor.keys()];
  const { data: visitors } = await admin.from("visitors").select("id, email").in("id", ids);
  const emailById = new Map((visitors ?? []).map((v) => [v.id, v.email as string]));

  const out: (RoomPrepVisitor & { seconds: number })[] = [];
  for (const [vid, evs] of byVisitor) {
    const email = emailById.get(vid);
    if (!email || email.toLowerCase().endsWith("@linkrunner.io")) continue;
    const timed: TimedEvent[] = evs.map((e) => ({ event_type: e.event_type, event_data: e.event_data }));
    const { seconds, isEstimate } = displayActiveTime(timed);
    const top = sectionBreakdown(timed)
      .slice(0, 3)
      .map((s) => `${s.label} ${formatDuration(s.seconds)}`)
      .join(", ");
    out.push({
      name: displayNameFromEmail(email),
      activeTimeLabel: seconds > 0 ? `${formatDuration(seconds)}${isEstimate ? " (est.)" : ""}` : "under a minute",
      topSections: top || "—",
      seconds,
    });
  }

  out.sort((a, b) => b.seconds - a.seconds);
  return {
    company: room.company_name,
    slug: room.slug,
    visitors: out.slice(0, 6).map(({ name, activeTimeLabel, topSections }) => ({ name, activeTimeLabel, topSections })),
  };
}

export interface PrepDoc {
  personName: string;
  activeTimeLabel: string;
  sectionLines: string[];
  actionLines: string[];
  hasActivity: boolean;
}

/**
 * Summarize a visitor's activity in a room. Returns hasActivity=false when the
 * person is tied to the room but hasn't opened it yet (still useful to say so).
 */
export async function buildPrepDoc(
  admin: SupabaseClient,
  roomId: string,
  email: string
): Promise<PrepDoc> {
  const personName = displayNameFromEmail(email);
  const empty: PrepDoc = {
    personName,
    activeTimeLabel: "",
    sectionLines: [],
    actionLines: [],
    hasActivity: false,
  };

  const { data: visitor } = await admin
    .from("visitors")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (!visitor) return empty;

  const { data: rawEvents } = await admin
    .from("analytics_events")
    .select("event_type, event_data, created_at")
    .eq("room_id", roomId)
    .eq("visitor_id", visitor.id)
    .order("created_at", { ascending: true })
    .limit(500);
  const events = (rawEvents ?? []) as { event_type: string; event_data: Record<string, unknown> | null }[];
  if (events.length === 0) return empty;

  const timed: TimedEvent[] = events.map((e) => ({
    event_type: e.event_type,
    event_data: e.event_data,
  }));

  const { seconds, isEstimate } = displayActiveTime(timed);
  const activeTimeLabel =
    seconds > 0 ? `${formatDuration(seconds)}${isEstimate ? " (est.)" : ""}` : "under a minute";

  const sectionLines = sectionBreakdown(timed)
    .slice(0, 6)
    .map((s) => `• ${s.label} — ${formatDuration(s.seconds)}`);

  const seen = new Set<string>();
  const actionLines: string[] = [];
  for (const e of events) {
    if (e.event_type === "time_on_tab") continue;
    const line = describeActivityEvent(e.event_type, e.event_data);
    if (seen.has(line)) continue;
    seen.add(line);
    actionLines.push(`• ${line}`);
  }

  return {
    personName,
    activeTimeLabel,
    sectionLines,
    actionLines: actionLines.slice(0, 10),
    hasActivity: true,
  };
}
