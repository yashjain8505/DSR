import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import { sendDailyDigest } from "@/lib/slack";
import { prettifyNameFromEmail } from "@/lib/session-summary";

export const maxDuration = 60;

const IST_OFFSET_MIN = 330; // Asia/Kolkata = UTC+5:30

/**
 * The UTC range covering "yesterday" in IST, and a human label for it.
 * Runs at 11:00 IST, so "yesterday" is the full previous IST calendar day.
 */
function yesterdayIstRange(nowMs: number): { startIso: string; endIso: string; label: string } {
  const offsetMs = IST_OFFSET_MIN * 60_000;
  const istNow = new Date(nowMs + offsetMs);
  // Midnight today in IST, expressed as a UTC instant.
  const istMidnightUtcMs =
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()) - offsetMs;
  const startMs = istMidnightUtcMs - 24 * 3600_000;
  const label = new Date(startMs + offsetMs).toISOString().slice(0, 10); // YYYY-MM-DD (the IST day)
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(istMidnightUtcMs).toISOString(),
    label,
  };
}

/** Build one bullet per person: name (company) — room · N sign-in(s). */
async function runDailyDigest(nowMs: number, test = false) {
  const admin = createAdminClient();
  const { startIso, endIso, label } = yesterdayIstRange(nowMs);

  const { data: sessions, error } = await admin
    .from("visitor_sessions")
    .select("visitor_id, room_id, started_at")
    .gte("started_at", startIso)
    .lt("started_at", endIso)
    .order("started_at", { ascending: true });
  if (error) throw new Error(`sessions: ${error.message}`);

  const rows = sessions ?? [];
  const visitorIds = [...new Set(rows.map((r) => r.visitor_id))];
  const roomIds = [...new Set(rows.map((r) => r.room_id))];
  const [{ data: visitors }, { data: dbRooms }] = await Promise.all([
    visitorIds.length
      ? admin.from("visitors").select("id, email").in("id", visitorIds)
      : Promise.resolve({ data: [] as { id: string; email: string }[] }),
    roomIds.length
      ? admin.from("rooms").select("id, slug, company_name").in("id", roomIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; company_name: string }[] }),
  ]);
  const emailById = new Map((visitors ?? []).map((v) => [v.id, v.email as string]));
  const roomById = new Map(
    (dbRooms ?? []).map((r) => [r.id, { slug: r.slug as string, company: r.company_name as string }])
  );

  // One entry per (visitor, room); count repeat sign-ins.
  const byPerson = new Map<string, { name: string; company: string; room: string; count: number }>();
  for (const r of rows) {
    const email = emailById.get(r.visitor_id);
    const room = roomById.get(r.room_id);
    if (!email || !room) continue;
    if (email.toLowerCase().endsWith("@linkrunner.io")) continue; // skip internal
    const key = `${r.visitor_id}:${r.room_id}`;
    const existing = byPerson.get(key);
    if (existing) existing.count++;
    else
      byPerson.set(key, {
        name: prettifyNameFromEmail(email),
        company: room.company,
        room: room.slug,
        count: 1,
      });
  }

  const lines = [...byPerson.values()]
    .sort((a, b) => a.company.localeCompare(b.company))
    .map(
      (e) =>
        `• *${e.name}* (${e.company}) — ${e.room}${e.count > 1 ? ` · ${e.count} sign-ins` : ""}`
    );

  const sent = await sendDailyDigest({ dateLabel: label, lines, test });
  return NextResponse.json({ date: label, people: lines.length, sent });
}

/**
 * GET /api/cron/daily-digest — the 11:00 IST daily report. Authenticated by
 * CRON_SECRET; scheduled via Vercel cron (05:30 UTC), which Hobby allows daily.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runDailyDigest(Date.now(), test);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "daily digest failed" },
      { status: 500 }
    );
  }
}

/** POST /api/cron/daily-digest — admin-triggered manual run. ?test=1 tags as [TEST]. */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runDailyDigest(Date.now(), test);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "daily digest failed" },
      { status: 500 }
    );
  }
}
