import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import { sendSigninAlert, sendSignoutAlert } from "@/lib/slack";
import {
  reconstructSessions,
  displayNameFromEmail,
  SESSION_GAP_MIN,
} from "@/lib/session-summary";

export const maxDuration = 60;

/** How far back to pull events when reconstructing sessions. */
const LOOKBACK_HOURS = 6;
/** Don't announce a sign-in for a session that started longer ago than this. */
const SIGNIN_MAX_AGE_MIN = 90;
/** Don't send a sign-out for a session whose last activity is older than this. */
const SIGNOUT_MAX_AGE_MIN = 180;

interface RawEvent {
  visitor_id: string;
  room_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

/** Page through analytics_events (PostgREST caps a single response at 1000). */
async function fetchEvents(
  admin: ReturnType<typeof createAdminClient>,
  sinceIso: string
): Promise<RawEvent[]> {
  const out: RawEvent[] = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("analytics_events")
      .select("visitor_id, room_id, event_type, event_data, created_at")
      .gte("created_at", sinceIso)
      .not("visitor_id", "is", null)
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`events: ${error.message}`);
    const batch = (data ?? []) as RawEvent[];
    out.push(...batch);
    if (batch.length < PAGE) break;
  }
  return out;
}

async function runSessionAlerts({ test = false }: { test?: boolean } = {}) {
  const admin = createAdminClient();
  const now = Date.now();
  const sinceIso = new Date(now - LOOKBACK_HOURS * 3600_000).toISOString();

  const events = await fetchEvents(admin, sinceIso);
  if (events.length === 0) {
    return NextResponse.json({ sessions: 0, signins: 0, summaries: 0 });
  }

  // Resolve the visitor emails and room labels we'll need, and drop internal
  // @linkrunner.io visitors (the analytics dashboard filters them the same way).
  const visitorIds = [...new Set(events.map((e) => e.visitor_id))];
  const roomIds = [...new Set(events.map((e) => e.room_id))];
  const [{ data: visitors }, { data: rooms }] = await Promise.all([
    admin.from("visitors").select("id, email").in("id", visitorIds),
    admin.from("rooms").select("id, slug, company_name").in("id", roomIds),
  ]);
  const emailById = new Map((visitors ?? []).map((v) => [v.id, v.email as string]));
  const roomById = new Map(
    (rooms ?? []).map((r) => [r.id, { slug: r.slug as string, company: r.company_name as string }])
  );

  const isInternal = (visitorId: string) =>
    (emailById.get(visitorId) ?? "").toLowerCase().endsWith("@linkrunner.io");
  const sessions = reconstructSessions(
    events.filter((e) => !isInternal(e.visitor_id))
  );

  let signins = 0;
  let signouts = 0;

  for (const s of sessions) {
    const email = emailById.get(s.visitorId);
    const room = roomById.get(s.roomId);
    if (!email || !room) continue;

    // Upsert the session ledger row; the returned row carries the current flags.
    const { data: row, error: upErr } = await admin
      .from("visitor_sessions")
      .upsert(
        {
          session_key: s.sessionKey,
          room_id: s.roomId,
          visitor_id: s.visitorId,
          started_at: s.startedAt,
          last_event_at: s.lastEventAt,
        },
        { onConflict: "session_key" }
      )
      .select("signin_alerted, summary_sent")
      .single();
    if (upErr || !row) continue;

    const personName = displayNameFromEmail(email);
    const startedMs = Date.parse(s.startedAt);
    const lastMs = Date.parse(s.lastEventAt);

    // Sign-in alert: once per session, only while it's still recent.
    if (!row.signin_alerted && now - startedMs < SIGNIN_MAX_AGE_MIN * 60_000) {
      const ok = await sendSigninAlert({
        personName,
        companyName: room.company,
        when: new Date(s.startedAt),
        test,
      });
      if (ok) {
        await admin
          .from("visitor_sessions")
          .update({ signin_alerted: true })
          .eq("session_key", s.sessionKey);
        signins++;
      }
    }

    // Sign-out ping: once the session has gone idle past the gap, and not too
    // stale. The `summary_sent` column is reused as the "sign-out sent" flag.
    const idleMs = now - lastMs;
    if (
      !row.summary_sent &&
      idleMs > SESSION_GAP_MIN * 60_000 &&
      idleMs < SIGNOUT_MAX_AGE_MIN * 60_000
    ) {
      const ok = await sendSignoutAlert({
        personName,
        companyName: room.company,
        when: new Date(s.lastEventAt),
        test,
      });
      if (ok) {
        await admin
          .from("visitor_sessions")
          .update({ summary_sent: true })
          .eq("session_key", s.sessionKey);
        signouts++;
      }
    }
  }

  return NextResponse.json({
    sessions: sessions.length,
    signins,
    signouts,
  });
}

/**
 * GET /api/cron/sessions — scheduled run. Authenticated by CRON_SECRET as a
 * bearer token, same as the Granola sync cron. On Vercel Hobby (daily cron cap)
 * an external scheduler (e.g. cron-job.org) hits this every few minutes.
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

  // ?test=1 tags every alert this run sends with [TEST].
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runSessionAlerts({ test });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "session cron failed" },
      { status: 500 }
    );
  }
}

/** POST /api/cron/sessions — admin-triggered manual run. ?test=1 tags alerts as [TEST]. */
export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const test = new URL(request.url).searchParams.get("test") === "1";
  try {
    return await runSessionAlerts({ test });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "session cron failed" },
      { status: 500 }
    );
  }
}
