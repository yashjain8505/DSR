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
